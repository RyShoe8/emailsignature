import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { verifySignatureTrackingToken, isAllowedTrackingDestination } from '@/lib/signatureTrackingToken';
import { getSignatureTrackingSecret } from '@/lib/signatureTrackingSecret';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const t = url.searchParams.get('t');
  const fallback = new URL('/', url.origin).toString();

  if (!t) {
    return NextResponse.redirect(fallback, 302);
  }

  const secret = getSignatureTrackingSecret();
  if (!secret) {
    return NextResponse.redirect(fallback, 302);
  }

  const payload = verifySignatureTrackingToken(t, secret);
  if (!payload || !isAllowedTrackingDestination(payload.d)) {
    return NextResponse.redirect(fallback, 302);
  }

  try {
    await connectMongoose();
    await SignatureClickEventModel.create({
      organizationId: new mongoose.Types.ObjectId(payload.oid),
      employeeId: payload.eid ? new mongoose.Types.ObjectId(payload.eid) : undefined,
      kind: payload.k,
      userAgent: request.headers.get('user-agent')?.slice(0, 500) || '',
      referer: request.headers.get('referer')?.slice(0, 500) || '',
    });
  } catch {
    // Still redirect so recipients are not stranded.
  }

  return NextResponse.redirect(payload.d, 302);
}
