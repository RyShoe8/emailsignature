import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { signGmailOAuthState } from '@/lib/gmailOAuthState';
import { getGoogleRedirectUri } from '@/lib/gmailApi';

const SCOPE = 'https://www.googleapis.com/auth/gmail.settings.basic';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL('/dashboard/signature?gmail=error&message=' + encodeURIComponent('Gmail is not configured'), request.url)
    );
  }

  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const state = signGmailOAuthState(session.user.id);
  const redirectUri = getGoogleRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(url);
}
