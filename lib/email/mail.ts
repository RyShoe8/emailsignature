import { brevoFetch, getBrevoSenderEmail, getBrevoSenderName, isBrevoConfigured } from '@/lib/email/brevo';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailErrorCode = 'email_not_configured' | 'send_failed';

export type SendEmailResult =
  | { ok: true; id?: string; devLogged?: boolean }
  | { ok: false; error: string; code: SendEmailErrorCode };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!isBrevoConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[Tailnote] Email (Brevo not configured):', {
        to: input.to,
        subject: input.subject,
        text: input.text,
      });
      return { ok: true, devLogged: true };
    }
    return {
      ok: false,
      error: 'Email is not configured (BREVO_API_KEY and BREVO_SENDER_EMAIL required)',
      code: 'email_not_configured',
    };
  }

  const result = await brevoFetch<{ messageId?: string }>('/smtp/email', {
    method: 'POST',
    json: {
      sender: {
        name: getBrevoSenderName(),
        email: getBrevoSenderEmail(),
      },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
    },
  });

  if (!result.ok) {
    return { ok: false, error: result.error, code: 'send_failed' };
  }

  return { ok: true, id: result.data.messageId };
}
