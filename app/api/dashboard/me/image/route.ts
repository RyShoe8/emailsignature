import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
const MAX_BYTES = 4 * 1024 * 1024;

type SessionUser = {
  id?: string;
  organizationId?: string;
};

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'webp'; // default to webp
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'File uploads are not configured (BLOB_READ_WRITE_TOKEN)' }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId || !user.id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
  }

  const mime = (file as File).type || 'application/octet-stream';
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: 'Only PNG, JPEG, WebP, and GIF images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 4 MB)' }, { status: 400 });
  }

  await connectMongoose();

  const buffer = Buffer.from(await file.arrayBuffer());
  
  let processedBuffer: Buffer = buffer;
  let finalMime = mime;
  let ext = extFromMime(mime);

  // Compress and resize images using sharp (skip GIFs to preserve animation)
  // Max width 400px for content blocks
  if (mime !== 'image/gif') {
    try {
      processedBuffer = await sharp(buffer)
        .resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();
      finalMime = 'image/webp';
      ext = 'webp';
    } catch (e) {
      console.error('Sharp compression failed, uploading original:', e);
    }
  }

  const pathname = `tailnote/users/${user.id}/images/${Date.now()}.${ext}`;

  const blob = await put(pathname, processedBuffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: finalMime,
  });

  return NextResponse.json({ url: blob.url });
}
