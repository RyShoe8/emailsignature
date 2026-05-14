import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth/server';

let cached: ReturnType<typeof toNextJsHandler> | undefined;

async function handlers() {
  if (!cached) {
    const auth = await getAuth();
    cached = toNextJsHandler(auth);
  }
  return cached;
}

export async function GET(request: Request) {
  return (await handlers()).GET(request);
}

export async function POST(request: Request) {
  return (await handlers()).POST(request);
}
