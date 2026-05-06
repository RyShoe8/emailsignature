import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
  }

  interface Session {
    user?: {
      email?: string | null;
      role?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
  }
}
