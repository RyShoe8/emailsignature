import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { nextCookies } from 'better-auth/next-js';

let authInstance: ReturnType<typeof betterAuth> | undefined;

export async function getAuth() {
  if (authInstance) return authInstance;
  const { connectMongoose, getMongoDb, getMongoClient } = await import('@/lib/mongoose');
  await connectMongoose();
  const db = getMongoDb();
  const client = getMongoClient();

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required');
  }

  authInstance = betterAuth({
    secret,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    database: mongodbAdapter(db as never, { client: client as never }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        if (process.env.NODE_ENV === 'development') {
          console.info('[Tailnote] Password reset:', user.email, url);
        }
        // Production: integrate Resend/SMTP using process.env.RESEND_API_KEY
      },
    },
    user: {
      additionalFields: {
        name: { type: 'string', required: false },
        organizationId: { type: 'string', required: false },
        role: { type: 'string', required: false },
        /** Tailnote platform operator; can open /admin and platform APIs */
        platformAdmin: { type: 'boolean', required: false },
      },
    },
    plugins: [nextCookies()],
  }) as unknown as ReturnType<typeof betterAuth>;

  return authInstance;
}
