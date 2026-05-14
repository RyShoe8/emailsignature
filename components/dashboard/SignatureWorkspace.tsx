'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { downloadHtml } from '@/lib/clipboard';
import { getPublicSiteOrigin } from '@/lib/siteOrigin';

type OrgResponse = {
  companyName?: string;
  website?: string;
  logoUrl?: string;
  logoLink?: string;
  primaryColor?: string;
  fontFamily?: string;
  socialLinks?: { linkedin?: string; facebook?: string; instagram?: string };
  locations?: { dallas?: string; boulder?: string };
  warehouseAddress?: string;
  animation?: { enabled?: boolean; gifUrl?: string };
  name?: string;
  plan?: string;
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
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, tRes] = await Promise.all([fetch('/api/dashboard/organization'), fetch('/api/dashboard/templates')]);
      const oJson = await oRes.json();
      const tJson = await tRes.json();
      if (oJson.organization) {
        const o = oJson.organization as OrgResponse;
        setOrg(o);
        setOrgName(String(o.name || ''));
      }
      const list: TemplateRow[] = tJson.templates || [];
      setTemplates(list);
      if (list[0]) setSelectedTemplateId(list[0]._id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
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
      includeAnimationSlot: org?.plan === 'pro' && Boolean(selectedTemplate.includeAnimationSlot),
    });
  }, [selectedTemplate, org?.plan]);

  const html = useMemo(() => {
    if (!engineTemplate) return '';
    return renderSignature({
      profile,
      brand,
      template: engineTemplate,
      publicSiteOrigin: getPublicSiteOrigin(),
    });
  }, [profile, brand, engineTemplate]);

  const canCopy =
    Boolean(profile.firstName.trim() && profile.lastName.trim() && profile.email.trim() && engineTemplate);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/dashboard/organization', {
        method: 'PATCH',
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!org) {
    return <p className="text-sm text-muted-foreground">Create an organization to edit signature defaults.</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
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
            <Label>Logo URL</Label>
            <Input
              value={org.logoUrl ?? ''}
              onChange={(e) => setOrg((o) => ({ ...(o || {}), logoUrl: e.target.value }))}
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
          <CardTitle>Live preview</CardTitle>
          <CardDescription>Sample person — employees use their own saved details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SignatureForm value={profile} onChange={setProfile} />
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Desktop</p>
              <SignaturePreviewFrame html={html} variant="desktop" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Mobile</p>
              <SignaturePreviewFrame html={html} variant="mobile" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopySignatureButton html={html} disabled={!canCopy} />
            <CopyRichTextButton html={html} disabled={!canCopy} />
            <Button
              type="button"
              variant="outline"
              disabled={!canCopy}
              onClick={() => downloadHtml('tailnote-signature.html', html)}
            >
              Download HTML
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
