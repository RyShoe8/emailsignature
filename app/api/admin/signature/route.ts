import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSignatureSettingsCollection } from '@/lib/db';
import { mockSignatureBrand, mockSignatureTemplate } from 'emailsignature-engine';
import type { SignatureBrand, SignatureTemplate } from 'emailsignature-engine';

export const dynamic = 'force-dynamic';

/** Single canonical row; avoids ambiguous findOne({}) when legacy duplicates exist. */
const SIGNATURE_SETTINGS_SCOPE = 'organization' as const;

function defaultPayload(): { brand: SignatureBrand; template: SignatureTemplate; updatedAt: null } {
  return {
    brand: { ...mockSignatureBrand },
    template: mockSignatureTemplate('standard'),
    updatedAt: null,
  };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== '';
}

function coalesceBrandFixed(body: unknown): SignatureBrand | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (!isNonEmptyString(b.companyName) || !isNonEmptyString(b.website) || !isNonEmptyString(b.logoUrl)) {
    return null;
  }
  const sl = b.socialLinks && typeof b.socialLinks === 'object' ? (b.socialLinks as Record<string, unknown>) : {};
  const loc = b.locations && typeof b.locations === 'object' ? (b.locations as Record<string, unknown>) : {};
  const anim =
    b.animation && typeof b.animation === 'object'
      ? (b.animation as { enabled?: unknown; gifUrl?: unknown })
      : { enabled: false, gifUrl: '' };

  return {
    companyName: (b.companyName as string).trim(),
    website: (b.website as string).trim(),
    logoUrl: (b.logoUrl as string).trim(),
    logoLink: isNonEmptyString(b.logoLink) ? (b.logoLink as string).trim() : '',
    primaryColor: isNonEmptyString(b.primaryColor) ? (b.primaryColor as string).trim() : '#CDAA7D',
    fontFamily: isNonEmptyString(b.fontFamily) ? (b.fontFamily as string).trim() : 'Arial',
    socialLinks: {
      linkedin: isNonEmptyString(sl.linkedin) ? (sl.linkedin as string).trim() : undefined,
      facebook: isNonEmptyString(sl.facebook) ? (sl.facebook as string).trim() : undefined,
      instagram: isNonEmptyString(sl.instagram) ? (sl.instagram as string).trim() : undefined,
    },
    locations: {
      dallas: isNonEmptyString(loc.dallas) ? (loc.dallas as string).trim() : undefined,
      boulder: isNonEmptyString(loc.boulder) ? (loc.boulder as string).trim() : undefined,
    },
    warehouseAddress: isNonEmptyString(b.warehouseAddress)
      ? (b.warehouseAddress as string).trim()
      : undefined,
    animation: {
      enabled: Boolean(anim.enabled),
      gifUrl: isNonEmptyString(anim.gifUrl) ? (anim.gifUrl as string).trim() : undefined,
    },
  };
}

function coalesceTemplate(body: unknown): SignatureTemplate | null {
  if (!body || typeof body !== 'object') return null;
  const t = body as Record<string, unknown>;
  if (!isNonEmptyString(t.id) || !isNonEmptyString(t.name)) return null;
  if (t.layout !== 'standard' && t.layout !== 'stacked') return null;
  if (!Array.isArray(t.elements)) return null;
  for (const el of t.elements) {
    if (!el || typeof el !== 'object' || !isNonEmptyString((el as { type?: string }).type)) {
      return null;
    }
  }
  return {
    id: (t.id as string).trim(),
    name: (t.name as string).trim(),
    layout: t.layout,
    elements: t.elements as SignatureTemplate['elements'],
  };
}

function parseBody(body: unknown): { brand: SignatureBrand; template: SignatureTemplate } | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const brand = coalesceBrandFixed(o.brand);
  const template = coalesceTemplate(o.template);
  if (!brand || !template) return null;
  return { brand, template };
}

/** Prefer scoped doc; if missing, tag one legacy row. Multiple legacy rows require manual cleanup in MongoDB. */
async function getCanonicalSignatureDoc() {
  const collection = await getSignatureSettingsCollection();
  let doc = await collection.findOne({ scope: SIGNATURE_SETTINGS_SCOPE });
  if (!doc) {
    const legacy = await collection.findOne({});
    if (legacy?.brand && legacy?.template) {
      await collection.updateOne({ _id: legacy._id }, { $set: { scope: SIGNATURE_SETTINGS_SCOPE } });
      doc = await collection.findOne({ scope: SIGNATURE_SETTINGS_SCOPE });
    }
  }
  return doc;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const doc = await getCanonicalSignatureDoc();

    if (!doc) {
      const d = defaultPayload();
      return NextResponse.json(d);
    }

    const { brand, template, updatedAt } = doc;
    return NextResponse.json({
      brand,
      template,
      updatedAt: updatedAt.toISOString(),
    });
  } catch (e) {
    console.error('GET /api/admin/signature', e);
    return NextResponse.json({ error: 'Failed to load signature settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseBody(json);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid brand or template' }, { status: 400 });
  }

  const { brand, template } = parsed;
  const updatedAt = new Date();

  try {
    const collection = await getSignatureSettingsCollection();
    await collection.updateOne(
      { scope: SIGNATURE_SETTINGS_SCOPE },
      {
        $set: {
          scope: SIGNATURE_SETTINGS_SCOPE,
          brand,
          template,
          updatedAt,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      brand,
      template,
      updatedAt: updatedAt.toISOString(),
    });
  } catch (e) {
    console.error('POST /api/admin/signature', e);
    return NextResponse.json({ error: 'Failed to save signature settings' }, { status: 500 });
  }
}
