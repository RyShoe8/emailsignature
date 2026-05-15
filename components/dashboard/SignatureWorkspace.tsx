'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  renderSignature,
  type SignatureBrand,
  type SignatureProfile,
  type SignatureTemplate,
} from 'emailsignature-engine';
import { engineTemplateFromStoredConfig, type TemplatePresetId } from '@/lib/email/templatePresets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignatureForm } from '@/components/signature/SignatureForm';
import { SignaturePreviewFrame } from '@/components/signature/SignaturePreviewFrame';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { CopyRichTextButton } from '@/components/signature/CopyRichTextButton';
import { OutlookInstallHelp } from '@/components/signature/OutlookInstallHelp';
import { downloadHtml } from '@/lib/clipboard';
import { getSignatureAssetOrigin } from '@/lib/siteOrigin';
import { shouldIncludeSignatureAnimation } from '@/lib/billing/entitlements';

type OrgResponse = {
  companyName?: string;
  website?: string;
  logoUrl?: string;
  logoLink?: string;
  primaryColor?: string;
  fontFamily?: string;
  socialLinks?: { linkedin?: string; facebook?: string; instagram?: string; reddit?: string };
  locations?: { dallas?: string; boulder?: string };
  warehouseAddress?: string;
  animation?: { enabled?: boolean; gifUrl?: string };
  name?: string;
  plan?: string;
  subscriptionStatus?: string;
  signatureClickTrackingEnabled?: boolean;
};

type TemplateRow = {
  _id: string;
  name: string;
  presetId: TemplatePresetId;
  includeAnimationSlot?: boolean;
};

function orgToBrand(org: OrgResponse, displayName: string): SignatureBrand {
  const sl = org.socialLinks ?? {};
  const loc = org.locations ?? {};
  return {
    companyName: (org.companyName || displayName || '').trim(),
    website: (org.website || '').trim(),
    logoUrl: (org.logoUrl || '').trim(),
    logoLink: (org.logoLink || '').trim(),
    primaryColor: org.primaryColor?.trim() || '#0a0a0a',
    fontFamily: org.fontFamily?.trim() || 'Arial',
    socialLinks: {
      linkedin: sl.linkedin?.trim(),
      facebook: sl.facebook?.trim(),
      instagram: sl.instagram?.trim(),
      reddit: sl.reddit?.trim(),
    },
    locations: {
      dallas: loc.dallas?.trim(),
      boulder: loc.boulder?.trim(),
    },
    warehouseAddress: org.warehouseAddress?.trim(),
    animation: {
      enabled: Boolean(org.animation?.enabled),
      gifUrl: org.animation?.gifUrl?.trim() ?? '',
    },
  };
}

const defaultProfile: SignatureProfile = {
  firstName: 'Alex',
  lastName: 'Rivera',
  title: 'Head of Operations',
  email: 'alex@example.com',
  officePhone: '',
  mobilePhone: '',
};

export function SignatureWorkspace() {
  const [org, setOrg] = useState<OrgResponse | null>(null);
  const [orgName, setOrgName] = useState('');
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [profile, setProfile] = useState<SignatureProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailBusy, setGmailBusy] = useState(false);
  /** Server-rendered HTML with signed tracking URLs when org flag is on. */
  const [trackedHtml, setTrackedHtml] = useState<string | null>(null);
  /** Bumps after mount so signature HTML re-renders with real `window` origin (SSR memo used localhost). */
  const [assetOriginNonce, setAssetOriginNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, tRes, gRes, pRes] = await Promise.all([
        fetch('/api/dashboard/organization', { credentials: 'include' }),
        fetch('/api/dashboard/templates', { credentials: 'include' }),
        fetch('/api/integrations/gmail/status', { credentials: 'include' }),
        fetch('/api/dashboard/me/signature-profile', { credentials: 'include' }),
      ]);
      const oJson = await oRes.json();
      const tJson = await tRes.json();
      const gJson = await gRes.json().catch(() => ({}));
      const pJson = await pRes.json().catch(() => ({}));
      if (oJson.organization) {
        const o = oJson.organization as OrgResponse;
        setOrg(o);
        setOrgName(String(o.name || ''));
      }
      const list: TemplateRow[] = tJson.templates || [];
      setTemplates(list);
      if (list[0]) setSelectedTemplateId(list[0]._id);
      if (gJson.connected) {
        setGmailConnected(true);
        setGmailEmail(String(gJson.googleEmail || ''));
      } else {
        setGmailConnected(false);
        setGmailEmail('');
      }
      if (pJson.profile && typeof pJson.profile === 'object') {
        const sp = pJson.profile as Partial<SignatureProfile>;
        setProfile({
          ...defaultProfile,
          firstName: typeof sp.firstName === 'string' ? sp.firstName : defaultProfile.firstName,
          lastName: typeof sp.lastName === 'string' ? sp.lastName : defaultProfile.lastName,
          title: typeof sp.title === 'string' ? sp.title : defaultProfile.title,
          email: typeof sp.email === 'string' ? sp.email : defaultProfile.email,
          officePhone: typeof sp.officePhone === 'string' ? sp.officePhone : '',
          mobilePhone: typeof sp.mobilePhone === 'string' ? sp.mobilePhone : '',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    setAssetOriginNonce(1);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const gmail = sp.get('gmail');
    const msg = sp.get('message');
    if (gmail === 'connected') {
      setMessage('Gmail connected. You can apply your signature below.');
      load();
    } else if (gmail === 'error' && msg) {
      setMessage(`Gmail: ${decodeURIComponent(msg)}`);
    }
    if (gmail) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [load]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t._id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const brand = useMemo(() => orgToBrand(org ?? {}, orgName), [org, orgName]);

  const engineTemplate: SignatureTemplate | null = useMemo(() => {
    if (!selectedTemplate) return null;
    return engineTemplateFromStoredConfig({
      templateId: selectedTemplate._id,
      name: selectedTemplate.name,
      presetId: selectedTemplate.presetId,
      includeAnimationSlot: shouldIncludeSignatureAnimation(
        {
          plan: org?.plan === 'pro' ? 'pro' : org?.plan === 'basic' ? 'basic' : 'none',
          subscriptionStatus:
            (org?.subscriptionStatus as 'none' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete') ??
            'none',
        },
        { includeAnimationSlot: Boolean(selectedTemplate.includeAnimationSlot) }
      ),
    });
  }, [selectedTemplate, org?.plan, org?.subscriptionStatus]);

  const html = useMemo(() => {
    if (!engineTemplate) return '';
    return renderSignature({
      profile,
      brand,
      template: engineTemplate,
      publicSiteOrigin: getSignatureAssetOrigin(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- assetOriginNonce forces post-mount recompute so preview URLs use window origin, not SSR fallback
  }, [profile, brand, engineTemplate, assetOriginNonce]);

  useEffect(() => {
    if (!org?.signatureClickTrackingEnabled || !selectedTemplateId || !engineTemplate) {
      setTrackedHtml(null);
      return;
    }
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      setTrackedHtml(null);
      return;
    }
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/dashboard/me/signature-html', {
            method: 'POST',
            credentials: 'include',
            signal: ac.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateId: selectedTemplateId,
              profile: {
                firstName: profile.firstName,
                lastName: profile.lastName,
                title: profile.title,
                email: profile.email,
                officePhone: profile.officePhone ?? '',
                mobilePhone: profile.mobilePhone ?? '',
              },
            }),
          });
          const j = (await res.json().catch(() => ({}))) as { html?: unknown };
          if (!res.ok || typeof j.html !== 'string') {
            setTrackedHtml(null);
            return;
          }
          setTrackedHtml(j.html);
        } catch (e) {
          if ((e as Error).name === 'AbortError') return;
          setTrackedHtml(null);
        }
      })();
    }, 450);
    return () => {
      ac.abort();
      window.clearTimeout(timer);
    };
  }, [
    org?.signatureClickTrackingEnabled,
    selectedTemplateId,
    profile.firstName,
    profile.lastName,
    profile.title,
    profile.email,
    profile.officePhone,
    profile.mobilePhone,
    brand.website,
    brand.logoUrl,
    brand.logoLink,
    brand.primaryColor,
    brand.fontFamily,
    brand.socialLinks?.linkedin,
    brand.socialLinks?.facebook,
    brand.socialLinks?.instagram,
    brand.socialLinks?.reddit,
    brand.locations?.dallas,
    brand.locations?.boulder,
    brand.warehouseAddress,
    brand.animation?.enabled,
    brand.animation?.gifUrl,
    org?.plan,
    engineTemplate,
    assetOriginNonce,
  ]);

  const previewHtml = trackedHtml ?? html;

  const canCopy =
    Boolean(profile.firstName.trim() && profile.lastName.trim() && profile.email.trim() && engineTemplate);

  const handleSaveProfile = async () => {
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      setProfileMessage('First name, last name, and email are required to save.');
      return;
    }
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/dashboard/me/signature-profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          title: profile.title,
          email: profile.email,
          officePhone: profile.officePhone ?? '',
          mobilePhone: profile.mobilePhone ?? '',
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileMessage(typeof j.error === 'string' ? j.error : 'Could not save your details');
        return;
      }
      if (j.profile && typeof j.profile === 'object') {
        const sp = j.profile as Partial<SignatureProfile>;
        setProfile({
          ...defaultProfile,
          firstName: typeof sp.firstName === 'string' ? sp.firstName : profile.firstName,
          lastName: typeof sp.lastName === 'string' ? sp.lastName : profile.lastName,
          title: typeof sp.title === 'string' ? sp.title : profile.title,
          email: typeof sp.email === 'string' ? sp.email : profile.email,
          officePhone: typeof sp.officePhone === 'string' ? sp.officePhone : '',
          mobilePhone: typeof sp.mobilePhone === 'string' ? sp.mobilePhone : '',
        });
      }
      setProfileMessage('Saved. We will pre-fill these fields next time you open Signature.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/dashboard/organization', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          companyName: orgName,
          website: org.website,
          logoUrl: org.logoUrl,
          logoLink: org.logoLink,
          primaryColor: org.primaryColor,
          fontFamily: org.fontFamily,
          socialLinks: org.socialLinks,
          locations: org.locations,
          warehouseAddress: org.warehouseAddress,
          animation: org.animation,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMessage(typeof j.error === 'string' ? j.error : 'Save failed');
        return;
      }
      setMessage('Saved');
      const j = await res.json();
      if (j.organization) setOrg(j.organization as OrgResponse);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !org) return;
    setUploadingLogo(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/dashboard/organization/logo', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof j.error === 'string' ? j.error : 'Logo upload failed');
        return;
      }
      if (typeof j.url === 'string') {
        setOrg((o) => ({ ...(o || {}), logoUrl: j.url }));
        setMessage('Logo uploaded — click Save to persist with other brand fields, or Save now from the button below.');
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleApplyGmail = async () => {
    if (!previewHtml.trim()) return;
    setGmailBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/integrations/gmail/apply-signature', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: previewHtml }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof j.error === 'string' ? j.error : 'Could not update Gmail signature');
        return;
      }
      setMessage(
        `Gmail signature updated for ${typeof j.sendAsEmail === 'string' ? j.sendAsEmail : 'your send-as address'}. Gmail may simplify HTML.`
      );
    } finally {
      setGmailBusy(false);
    }
  };

  const handleDisconnectGmail = async () => {
    setGmailBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/integrations/gmail/disconnect', { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        setMessage('Could not disconnect Gmail');
        return;
      }
      setGmailConnected(false);
      setGmailEmail('');
      setMessage('Gmail disconnected.');
    } finally {
      setGmailBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!org) {
    return <p className="text-sm text-muted-foreground">Create an organization to edit signature defaults.</p>;
  }

  return (
    <div className="min-w-0 space-y-8 max-w-full">
      <div className="grid max-w-full min-w-0 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization brand</CardTitle>
            <CardDescription>These values feed the signature engine for every employee.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Organization name</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={org.website ?? ''}
                onChange={(e) => setOrg((o) => ({ ...(o || {}), website: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Social links</p>
              <p className="text-xs text-muted-foreground">
                Shown as icon links when the template includes social. Full profile URLs (https://…).
              </p>
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input
                type="url"
                value={org.socialLinks?.linkedin ?? ''}
                onChange={(e) =>
                  setOrg((o) => ({
                    ...(o || {}),
                    socialLinks: { ...(o?.socialLinks ?? {}), linkedin: e.target.value },
                  }))
                }
                placeholder="https://www.linkedin.com/company/…"
              />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                type="url"
                value={org.socialLinks?.facebook ?? ''}
                onChange={(e) =>
                  setOrg((o) => ({
                    ...(o || {}),
                    socialLinks: { ...(o?.socialLinks ?? {}), facebook: e.target.value },
                  }))
                }
                placeholder="https://www.facebook.com/…"
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                type="url"
                value={org.socialLinks?.instagram ?? ''}
                onChange={(e) =>
                  setOrg((o) => ({
                    ...(o || {}),
                    socialLinks: { ...(o?.socialLinks ?? {}), instagram: e.target.value },
                  }))
                }
                placeholder="https://www.instagram.com/…"
              />
            </div>
            <div className="space-y-2">
              <Label>Reddit</Label>
              <Input
                type="url"
                value={org.socialLinks?.reddit ?? ''}
                onChange={(e) =>
                  setOrg((o) => ({
                    ...(o || {}),
                    socialLinks: { ...(o?.socialLinks ?? {}), reddit: e.target.value },
                  }))
                }
                placeholder="https://www.reddit.com/user/… or https://www.reddit.com/r/…"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="w-full min-w-0 max-w-full sm:max-w-xs"
                  onChange={handleLogoFile}
                  disabled={uploadingLogo}
                />
                {uploadingLogo ? <span className="text-xs text-muted-foreground">Uploading…</span> : null}
                {org.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={org.logoUrl} alt="" className="h-12 w-auto max-w-[120px] object-contain border rounded bg-white p-1" />
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!org.logoUrl}
                  onClick={() => setOrg((o) => ({ ...(o || {}), logoUrl: '' }))}
                >
                  Clear logo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, or GIF up to 4 MB. Or paste a hosted image URL.</p>
            </div>
            <div className="space-y-2">
              <Label>Logo image URL (optional)</Label>
              <Input
                value={org.logoUrl ?? ''}
                onChange={(e) => setOrg((o) => ({ ...(o || {}), logoUrl: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo link (optional)</Label>
              <Input
                value={org.logoLink ?? ''}
                onChange={(e) => setOrg((o) => ({ ...(o || {}), logoLink: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label>Primary color</Label>
              <Input
                value={org.primaryColor ?? ''}
                onChange={(e) => setOrg((o) => ({ ...(o || {}), primaryColor: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Preview template</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.presetId})
                  </option>
                ))}
              </select>
            </div>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Install to your inbox</CardTitle>
            <CardDescription>Gmail (OAuth) and Outlook (manual).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm font-medium">Gmail</p>
              {gmailConnected ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Connected{gmailEmail ? ` as ${gmailEmail}` : ''}. Gmail may rewrite HTML when saving.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={gmailBusy || !canCopy} onClick={handleApplyGmail}>
                      {gmailBusy ? 'Applying…' : 'Apply signature to Gmail'}
                    </Button>
                    <Button type="button" variant="outline" disabled={gmailBusy} onClick={handleDisconnectGmail}>
                      Disconnect Gmail
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Connect once, then apply the preview HTML to your Gmail send-as signature.</p>
                  <Button type="button" variant="secondary" asChild>
                    <a href="/api/integrations/gmail/start">Connect Gmail</a>
                  </Button>
                </>
              )}
            </div>
            <OutlookInstallHelp />
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-full">
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <CardDescription>
            Sample person for preview — save your details below so they persist when you return. Employees use their own
            records on the employee page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 max-w-full min-w-0">
          <SignatureForm value={profile} onChange={setProfile} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" disabled={savingProfile} onClick={() => void handleSaveProfile()}>
              {savingProfile ? 'Saving…' : 'Save my details'}
            </Button>
            {profileMessage ? <p className="text-sm text-muted-foreground">{profileMessage}</p> : null}
          </div>
          <div className="grid grid-cols-1 gap-10 min-w-0">
            <div className="min-w-0 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Desktop</p>
              <SignaturePreviewFrame html={previewHtml} variant="desktop" />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Mobile</p>
              <SignaturePreviewFrame html={previewHtml} variant="mobile" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopySignatureButton html={previewHtml} disabled={!canCopy} />
            <CopyRichTextButton html={previewHtml} disabled={!canCopy} />
            <Button
              type="button"
              variant="outline"
              disabled={!canCopy}
              onClick={() => downloadHtml('tailnote-signature.html', previewHtml)}
            >
              Download HTML
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
