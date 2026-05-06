'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  renderSignature,
  type SignatureProfile,
  type SignatureBrand,
  type SignatureTemplate,
  type SignatureElement,
} from 'emailsignature-engine';
import { SignatureForm } from '@/components/admin/signature/SignatureForm';
import { SignaturePreview } from '@/components/admin/signature/SignaturePreview';
import { CopyButton } from '@/components/admin/signature/CopyButton';
import styles from './page.module.css';

type Layout = SignatureTemplate['layout'];

type ToggleState = {
  showSocial: boolean;
  showLocations: boolean;
  showWarehouse: boolean;
  showDivider: boolean;
  useAnimation: boolean;
};

function togglesFromElements(elements: SignatureElement[]): ToggleState {
  return {
    showSocial: elements.some((e) => e.type === 'social'),
    showLocations: elements.some((e) => e.type === 'locations'),
    showWarehouse: elements.some((e) => e.type === 'warehouse'),
    showDivider: elements.some((e) => e.type === 'divider'),
    useAnimation: elements.some((e) => e.type === 'animation'),
  };
}

function buildElements(t: ToggleState): SignatureElement[] {
  const out: SignatureElement[] = [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
  ];
  if (t.showSocial) out.push({ type: 'social' });
  if (t.showDivider) out.push({ type: 'divider' });
  if (t.showLocations) out.push({ type: 'locations' });
  if (t.showWarehouse) out.push({ type: 'warehouse' });
  if (t.useAnimation) out.push({ type: 'animation' });
  return out;
}

/** Neutral defaults for form state — does not inject mock/example URLs or addresses. */
function emptyBrand(): SignatureBrand {
  return {
    companyName: '',
    website: '',
    logoUrl: '',
    logoLink: '',
    primaryColor: '#CDAA7D',
    fontFamily: 'Arial',
    socialLinks: {},
    locations: {},
    warehouseAddress: undefined,
    animation: { enabled: false, gifUrl: '' },
  };
}

/** Shape API-loaded brand for the UI without merging fixture placeholders. */
function coerceBrandFromApi(brand: SignatureBrand): SignatureBrand {
  const sl = brand.socialLinks ?? {};
  const loc = brand.locations ?? {};
  return {
    companyName: brand.companyName ?? '',
    website: brand.website ?? '',
    logoUrl: brand.logoUrl ?? '',
    logoLink: brand.logoLink ?? '',
    primaryColor: brand.primaryColor?.trim() ? brand.primaryColor.trim() : '#CDAA7D',
    fontFamily: brand.fontFamily?.trim() ? brand.fontFamily.trim() : 'Arial',
    socialLinks: {
      linkedin: sl.linkedin?.trim() || undefined,
      facebook: sl.facebook?.trim() || undefined,
      instagram: sl.instagram?.trim() || undefined,
    },
    locations: {
      dallas: loc.dallas?.trim() || undefined,
      boulder: loc.boulder?.trim() || undefined,
    },
    warehouseAddress: brand.warehouseAddress?.trim() || undefined,
    animation: {
      enabled: brand.animation?.enabled ?? false,
      gifUrl: brand.animation?.gifUrl?.trim() ?? '',
    },
  };
}

const defaultProfile: SignatureProfile = {
  firstName: '',
  lastName: '',
  title: '',
  email: '',
  officePhone: '',
  mobilePhone: '',
};

const FONT_OPTIONS = ['Arial', 'Georgia', 'Tahoma', 'Verdana', 'Helvetica'] as const;

export default function AdminSignaturePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [profile, setProfile] = useState<SignatureProfile>(defaultProfile);
  const [brand, setBrand] = useState<SignatureBrand>(() => emptyBrand());
  const [layout, setLayout] = useState<Layout>('standard');
  const [toggles, setToggles] = useState<ToggleState>(() =>
    togglesFromElements(
      buildElements({
        showSocial: true,
        showLocations: true,
        showWarehouse: true,
        showDivider: true,
        useAnimation: false,
      })
    )
  );
  const [templateMeta, setTemplateMeta] = useState({ id: 'org', name: 'Organization default' });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const loadSettings = useCallback(async () => {
    setSettingsError(null);
    setIsSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/signature');
      if (!res.ok) {
        throw new Error('Request failed');
      }
      const data = await res.json();
      const nextToggles = togglesFromElements(data.template.elements);
      setLayout(data.template.layout);
      setToggles(nextToggles);
      setTemplateMeta({ id: data.template.id, name: data.template.name });
      setBrand(
        coerceBrandFromApi({
          ...data.brand,
          animation: {
            enabled: nextToggles.useAnimation,
            gifUrl: data.brand.animation?.gifUrl ?? '',
          },
        })
      );
      setLastUpdated(
        typeof data.updatedAt === 'string' ? data.updatedAt : data.updatedAt ? String(data.updatedAt) : null
      );
      setPreviewKey((k) => k + 1);
    } catch {
      setSettingsError('Could not load organization settings. You can retry, or continue with defaults.');
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!saveMessage) return;
    const t = window.setTimeout(() => setSaveMessage(null), 3500);
    return () => window.clearTimeout(t);
  }, [saveMessage]);

  const template = useMemo<SignatureTemplate>(
    () => ({
      id: templateMeta.id,
      name: templateMeta.name,
      layout,
      elements: buildElements(toggles),
    }),
    [templateMeta, layout, toggles]
  );

  const html = useMemo(
    () => renderSignature({ profile, brand, template }),
    [profile, brand, template]
  );

  const canCopy =
    !isSettingsLoading &&
    profile.firstName.trim() !== '' &&
    profile.lastName.trim() !== '' &&
    profile.email.trim() !== '';

  const setBrandField =
    <K extends keyof SignatureBrand>(key: K) =>
    (value: SignatureBrand[K]) => {
      setBrand((b) => ({ ...b, [key]: value }));
    };

  const setSocial = (key: keyof SignatureBrand['socialLinks'], value: string) => {
    setBrand((b) => ({
      ...b,
      socialLinks: { ...b.socialLinks, [key]: value || undefined },
    }));
  };

  const setLocation = (key: keyof SignatureBrand['locations'], value: string) => {
    setBrand((b) => ({
      ...b,
      locations: { ...b.locations, [key]: value || undefined },
    }));
  };

  const handleSaveOrg = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/admin/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, template }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(
          typeof data.error === 'string' ? data.error : 'Save failed. Check your fields and try again.'
        );
        return;
      }
      if (data.template) {
        setTemplateMeta({ id: data.template.id, name: data.template.name });
      }
      if (data.updatedAt) {
        setLastUpdated(data.updatedAt);
      }
      setSaveMessage('Organization signature saved.');
      setPreviewKey((k) => k + 1);
    } catch {
      setSaveError('Save failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1>Email signature</h1>
      <p className={styles.lead}>
        Admins save organization branding (logo, studios, design center, social links, layout) once;
        it loads from the server for every signed-in user. Name, title, email, and phones are filled in
        locally in this browser only and are not stored—each person enters their own, then copies the HTML
        for Gmail or Outlook.
      </p>

      {settingsError && (
        <div className={styles.loadError} role="alert">
          <p>{settingsError}</p>
          <button type="button" className={styles.retryBtn} onClick={loadSettings}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.grid}>
        {isAdmin ? (
          <section className={styles.card}>
            <h2>Brand &amp; template</h2>
            {isSettingsLoading && <p className={styles.muted}>Loading saved settings…</p>}
            {lastUpdated && !isSettingsLoading && (
              <p className={styles.muted}>
                Last saved: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
            {saveMessage && <p className={styles.saveOk}>{saveMessage}</p>}
            {saveError && <p className={styles.error}>{saveError}</p>}

            <div className={styles.checkboxRow}>
              <label>
                <input
                  type="checkbox"
                  disabled={isSettingsLoading}
                  checked={toggles.showSocial}
                  onChange={(e) =>
                    setToggles((t) => ({ ...t, showSocial: e.target.checked }))
                  }
                />
                Show social
              </label>
              <label>
                <input
                  type="checkbox"
                  disabled={isSettingsLoading}
                  checked={toggles.showLocations}
                  onChange={(e) =>
                    setToggles((t) => ({ ...t, showLocations: e.target.checked }))
                  }
                />
                Show design studios
              </label>
              <label>
                <input
                  type="checkbox"
                  disabled={isSettingsLoading}
                  checked={toggles.showWarehouse}
                  onChange={(e) =>
                    setToggles((t) => ({ ...t, showWarehouse: e.target.checked }))
                  }
                />
                Show design center / warehouse
              </label>
              <label>
                <input
                  type="checkbox"
                  disabled={isSettingsLoading}
                  checked={toggles.showDivider}
                  onChange={(e) =>
                    setToggles((t) => ({ ...t, showDivider: e.target.checked }))
                  }
                />
                Show divider
              </label>
              <label>
                <input
                  type="checkbox"
                  disabled={isSettingsLoading}
                  checked={toggles.useAnimation}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setToggles((t) => ({ ...t, useAnimation: on }));
                    setBrand((b) => ({
                      ...b,
                      animation: {
                        enabled: on,
                        gifUrl: b.animation?.gifUrl ?? '',
                      },
                    }));
                  }}
                />
                Use animated logo (GIF)
              </label>
            </div>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Layout
              <select
                disabled={isSettingsLoading}
                value={layout}
                onChange={(e) => setLayout(e.target.value as Layout)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  minWidth: '220px',
                  fontSize: '14px',
                }}
              >
                <option value="standard">Standard (logo left)</option>
                <option value="stacked">Stacked (logo top)</option>
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Font
              <select
                disabled={isSettingsLoading}
                value={brand.fontFamily}
                onChange={(e) => setBrandField('fontFamily')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  minWidth: '220px',
                  fontSize: '14px',
                }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Primary color
              <input
                type="text"
                disabled={isSettingsLoading}
                value={brand.primaryColor}
                onChange={(e) => setBrandField('primaryColor')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '320px',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Logo image URL
              <input
                type="url"
                disabled={isSettingsLoading}
                value={brand.logoUrl}
                onChange={(e) => setBrandField('logoUrl')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                }}
              />
              <div style={{ marginTop: '0.35rem', fontSize: '12px', color: '#666' }}>
                For best iPhone/email compatibility, use a PNG URL on your own domain and avoid spaces.
              </div>
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Logo link (click-through URL)
              <input
                type="url"
                disabled={isSettingsLoading}
                value={brand.logoLink}
                onChange={(e) => setBrandField('logoLink')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Animated GIF URL (optional; first frame should look good in Outlook; keep under ~200KB)
              <input
                type="url"
                disabled={isSettingsLoading}
                value={brand.animation?.gifUrl ?? ''}
                onChange={(e) =>
                  setBrand((b) => ({
                    ...b,
                    animation: {
                      enabled: Boolean(b.animation?.enabled),
                      gifUrl: e.target.value,
                    },
                  }))
                }
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Website
              <input
                type="text"
                disabled={isSettingsLoading}
                value={brand.website}
                onChange={(e) => setBrandField('website')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Company name (stored for future templates)
              <input
                type="text"
                disabled={isSettingsLoading}
                value={brand.companyName}
                onChange={(e) => setBrandField('companyName')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                }}
              />
            </label>

            <fieldset
              style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '0.75rem' }}
            >
              <legend style={{ fontSize: '13px', padding: '0 0.35rem' }}>Social</legend>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px' }}>
                LinkedIn
                <input
                  type="url"
                  disabled={isSettingsLoading}
                  value={brand.socialLinks.linkedin ?? ''}
                  onChange={(e) => setSocial('linkedin', e.target.value)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px' }}>
                Facebook
                <input
                  type="url"
                  disabled={isSettingsLoading}
                  value={brand.socialLinks.facebook ?? ''}
                  onChange={(e) => setSocial('facebook', e.target.value)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
              <label style={{ display: 'block', fontSize: '13px' }}>
                Instagram
                <input
                  type="url"
                  disabled={isSettingsLoading}
                  value={brand.socialLinks.instagram ?? ''}
                  onChange={(e) => setSocial('instagram', e.target.value)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
            </fieldset>

            <fieldset
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                padding: '0.75rem',
                marginTop: '0.75rem',
              }}
            >
              <legend style={{ fontSize: '13px', padding: '0 0.35rem' }}>
                Design studios &amp; design center
              </legend>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px' }}>
                Dallas
                <input
                  type="text"
                  disabled={isSettingsLoading}
                  value={brand.locations.dallas ?? ''}
                  onChange={(e) => setLocation('dallas', e.target.value)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px' }}>
                Boulder
                <input
                  type="text"
                  disabled={isSettingsLoading}
                  value={brand.locations.boulder ?? ''}
                  onChange={(e) => setLocation('boulder', e.target.value)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
              <label style={{ display: 'block', fontSize: '13px' }}>
                Design center / warehouse
                <input
                  type="text"
                  disabled={isSettingsLoading}
                  value={brand.warehouseAddress ?? ''}
                  onChange={(e) => setBrandField('warehouseAddress')(e.target.value || undefined)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
            </fieldset>

            <div className={styles.saveRow}>
              <button
                type="button"
                className={styles.saveBtn}
                disabled={isSettingsLoading || isSaving}
                onClick={handleSaveOrg}
              >
                {isSaving ? 'Saving…' : 'Save organization signature'}
              </button>
            </div>
          </section>
        ) : (
          <section className={styles.card}>
            <h2>Brand &amp; template</h2>
            {isSettingsLoading && <p className={styles.muted}>Loading organization settings…</p>}
            <p className={styles.notice}>
              Only administrators can change organization branding. The preview below uses the saved
              organization settings.
            </p>
          </section>
        )}

        <section className={styles.card}>
          <h2>Your signature</h2>
          <SignatureForm value={profile} onChange={setProfile} />
          {!canCopy && !isSettingsLoading && (
            <p className={styles.error}>Enter first name, last name, and email to enable copying.</p>
          )}
          {isSettingsLoading && (
            <p className={styles.muted}>Enter your details after settings finish loading.</p>
          )}
        </section>

        <section className={`${styles.card} ${styles.previewSection}`}>
          <h2>Preview</h2>
          {isSettingsLoading ? (
            <p className={styles.muted}>Loading preview…</p>
          ) : (
            <SignaturePreview html={html} animationKey={previewKey} />
          )}
          <div className={styles.row}>
            <CopyButton html={html} disabled={!canCopy} />
          </div>
          <div className={styles.hint}>
            <p>
              <strong>How to paste:</strong> Use <strong>Copy signature</strong>, then open Gmail
              → Settings → General → Signature, or Outlook → File → Options → Mail → Signatures,
              and paste. Outlook may show only the first frame of an animated GIF; design that
              frame to look good on its own. The light fade you see here is only in this admin
              preview, not in the copied HTML.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
