import { Resend } from 'resend';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; id?: string; devLogged?: boolean }
  | { ok: false; error: string };

function getFromAddress(): string {
  return process.env.EMAIL_FROM || 'Tailnote <onboarding@resend.dev>';
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[Tailnote] Email (no RESEND_API_KEY):', {
        to: input.to,
        subject: input.subject,
        text: input.text,
      });
      return { ok: true, devLogged: true };
    }
    return { ok: false, error: 'Email is not configured (RESEND_API_KEY missing)' };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    return { ok: false, error: error.message || 'Failed to send email' };
  }

  return { ok: true, id: data?.id };
}
