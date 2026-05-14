import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/onboarding') {
    const token = getSessionCookie(request);
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/login')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const suffix = pathname === '/admin' ? '' : pathname.replace(/^\/admin/, '');
    return NextResponse.redirect(new URL(`/dashboard${suffix || ''}`, request.url));
  }

  const needsAuth =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/dashboard') ||
    pathname.startsWith('/api/stripe/checkout') ||
    pathname.startsWith('/api/stripe/portal') ||
    pathname.startsWith('/api/onboarding');

  if (needsAuth) {
    const token = getSessionCookie(request);
    if (!token) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/onboarding',
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/dashboard/:path*',
    '/api/stripe/checkout',
    '/api/stripe/portal',
    '/api/onboarding/:path*',
  ],
};
