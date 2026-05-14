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

  authInstance = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    database: mongodbAdapter(db, { client }),
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
      },
    },
    plugins: [nextCookies()],
  });

  return authInstance;
}
