'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { renderSignature } from 'emailsignature-engine';
import { buildRenderInput } from '@/lib/email/toRenderInput';
import { engineTemplateFromStoredConfig, type TemplatePresetId } from '@/lib/email/templatePresets';
import { orgToBrandInput } from '@/lib/renderEmployeeSignature';
import { getPublicSiteOrigin } from '@/lib/siteOrigin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignatureForm } from '@/components/signature/SignatureForm';
import { SignaturePreviewFrame } from '@/components/signature/SignaturePreviewFrame';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { CopyRichTextButton } from '@/components/signature/CopyRichTextButton';
import { OutlookInstallHelp } from '@/components/signature/OutlookInstallHelp';
import { downloadHtml } from '@/lib/clipboard';
import type { SignatureProfile } from 'emailsignature-engine';

type TemplateOption = { _id: string; name: string; presetId: string; includeAnimationSlot?: boolean };
type OrgJson = Record<string, unknown>;

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const [org, setOrg] = useState<OrgJson | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [previewToken, setPreviewToken] = useState('');
  const [profile, setProfile] = useState<SignatureProfile>({
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    officePhone: '',
    mobilePhone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailBusy, setGmailBusy] = useState(false);
  const [installMessage, setInstallMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, tmplRes, orgRes, gRes] = await Promise.all([
        fetch(`/api/dashboard/employees/${id}`, { credentials: 'include' }),
        fetch('/api/dashboard/templates', { credentials: 'include' }),
        fetch('/api/dashboard/organization', { credentials: 'include' }),
        fetch('/api/integrations/gmail/status', { credentials: 'include' }),
      ]);
      const empJson = await empRes.json();
      const tmplJson = await tmplRes.json();
      const orgJson = await orgRes.json();
      if (!empRes.ok) {
        setError('Employee not found');
        return;
      }
      const e = empJson.employee;
      setFirstName(e.firstName);
      setLastName(e.lastName);
      setTitle(e.title || '');
      setEmail(e.email);
      setPhone(e.phone || '');
      setLinkedin(e.linkedin || '');
      setTwitter(e.twitter || '');
      setTemplateId(String(e.templateId));
      setPreviewToken(e.previewToken);
      setProfile({
        firstName: e.firstName,
        lastName: e.lastName,
        title: e.title || '',
        email: e.email,
        officePhone: e.phone || '',
        mobilePhone: '',
      });
      setTemplates(tmplJson.templates || []);
      setOrg(orgJson.organization || null);
      const gJson = await gRes.json().catch(() => ({}));
      if (gJson.connected) {
        setGmailConnected(true);
        setGmailEmail(String(gJson.googleEmail || ''));
      } else {
        setGmailConnected(false);
        setGmailEmail('');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setProfile((p) => ({
      ...p,
      firstName,
      lastName,
      title,
      email,
      officePhone: phone,
    }));
  }, [firstName, lastName, title, email, phone]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t._id === templateId),
    [templates, templateId]
  );

  const html = useMemo(() => {
    if (!org || !selectedTemplate) return '';
    const plan = String(org.plan || 'none');
    const engineTemplate = engineTemplateFromStoredConfig({
      templateId: selectedTemplate._id,
      name: selectedTemplate.name,
      presetId: selectedTemplate.presetId as TemplatePresetId,
      includeAnimationSlot: plan === 'pro' && Boolean(selectedTemplate.includeAnimationSlot),
    });
    return renderSignature(
      buildRenderInput({
        orgBrand: orgToBrandInput(org as never),
        employee: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          title: profile.title,
          email: profile.email,
          officePhone: profile.officePhone,
          mobilePhone: profile.mobilePhone,
        },
        template: engineTemplate,
        publicSiteOrigin: getPublicSiteOrigin(),
      })
    );
  }, [org, selectedTemplate, profile]);

  const previewUrl = useMemo(() => {
    if (!previewToken) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/p/${previewToken}`;
  }, [previewToken]);

  async function save() {
    setError(null);
    const res = await fetch(`/api/dashboard/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        title,
        email,
        phone,
        linkedin,
        twitter,
        templateId,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === 'string' ? j.error : 'Save failed');
      return;
    }
    void load();
  }

  async function remove() {
    if (!confirm('Delete this employee?')) return;
    const res = await fetch(`/api/dashboard/employees/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/dashboard/employees');
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error && !firstName) return <p className="text-sm text-destructive">{error}</p>;

  const canCopy =
    profile.firstName.trim() && profile.lastName.trim() && profile.email.trim() && html.trim();

  async function handleApplyGmail() {
    if (!html.trim()) return;
    setGmailBusy(true);
    setInstallMessage(null);
    try {
      const res = await fetch('/api/integrations/gmail/apply-signature', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInstallMessage(typeof j.error === 'string' ? j.error : 'Could not update Gmail signature');
        return;
      }
      setInstallMessage(
        `Gmail signature updated for ${typeof j.sendAsEmail === 'string' ? j.sendAsEmail : 'your send-as address'}. Gmail may simplify HTML.`
      );
    } finally {
      setGmailBusy(false);
    }
  }

  async function handleDisconnectGmail() {
    setGmailBusy(true);
    setInstallMessage(null);
    try {
      const res = await fetch('/api/integrations/gmail/disconnect', { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        setInstallMessage('Could not disconnect Gmail');
        return;
      }
      setGmailConnected(false);
      setGmailEmail('');
      setInstallMessage('Gmail disconnected.');
    } finally {
      setGmailBusy(false);
    }
  }

  return (
    <div className="max-w-7xl space-y-8 w-full min-w-0">
      <Link href="/dashboard/employees" className="text-sm text-muted-foreground hover:text-foreground">
        ← Employees
      </Link>
      <div className="grid gap-8 lg:grid-cols-2 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Edit employee</CardTitle>
            <CardDescription>Twitter is stored but not rendered in signatures yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.presetId})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Twitter URL</Label>
              <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void save()}>
                Save
              </Button>
              <Button type="button" variant="outline" onClick={() => void remove()}>
                Delete
              </Button>
            </div>
            {previewUrl && (
              <p className="text-xs text-muted-foreground break-all">
                Hosted preview:{' '}
                <a href={previewUrl} className="underline" target="_blank" rel="noreferrer">
                  {previewUrl}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Install to your inbox</CardTitle>
            <CardDescription>Gmail uses the preview HTML below. Outlook is manual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm font-medium">Gmail</p>
              {installMessage && <p className="text-xs text-muted-foreground">{installMessage}</p>}
              {gmailConnected ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Connected{gmailEmail ? ` as ${gmailEmail}` : ''}.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={gmailBusy || !canCopy} onClick={() => void handleApplyGmail()}>
                      {gmailBusy ? 'Applying…' : 'Apply signature to Gmail'}
                    </Button>
                    <Button type="button" variant="outline" disabled={gmailBusy} onClick={() => void handleDisconnectGmail()}>
                      Disconnect Gmail
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Connect your Google account once (also available on the organization Signature page).
                  </p>
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

      <Card className="max-w-full min-w-0">
        <CardHeader>
          <CardTitle>Preview & export</CardTitle>
          <CardDescription>Desktop and mobile frames; hosted page matches saved data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 max-w-full min-w-0">
          <SignatureForm value={profile} onChange={setProfile} />
          <div className="grid grid-cols-1 gap-10 min-w-0">
            <div className="min-w-0 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Desktop</p>
              <SignaturePreviewFrame html={html} variant="desktop" />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Mobile</p>
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
              onClick={() => downloadHtml('signature.html', html)}
            >
              Download HTML
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
