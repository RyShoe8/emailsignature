import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isLoginPage = req.nextUrl.pathname === '/admin/login';
    const isAdminPageRoute = req.nextUrl.pathname.startsWith('/admin');
    const isAdminApiRoute = req.nextUrl.pathname.startsWith('/api/admin');

    if (isLoginPage) {
      return NextResponse.next();
    }

    if (isAdminPageRoute && !token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    if (isAdminApiRoute && !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isLoginPage = req.nextUrl.pathname === '/admin/login';
        const isAdminPageRoute = req.nextUrl.pathname.startsWith('/admin');
        const isAdminApiRoute = req.nextUrl.pathname.startsWith('/api/admin');

        if (isLoginPage) {
          return true;
        }

        if (isAdminPageRoute) {
          return !!token;
        }

        if (isAdminApiRoute) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
