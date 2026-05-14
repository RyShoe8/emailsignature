import { headers } from 'next/headers';
import { getAuth } from './server';

export async function getServerSession() {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
}
