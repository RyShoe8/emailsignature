import { brevoFetch, getBrevoListId, isBrevoConfigured } from '@/lib/email/brevo';

function parseName(name?: string | null): { FNAME?: string; LNAME?: string } {
  const trimmed = name?.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { FNAME: parts[0], LNAME: parts.slice(1).join(' ') };
  }
  return { FNAME: parts[0] };
}

export async function syncUserToBrevoList(input: {
  email: string;
  name?: string | null;
}): Promise<void> {
  if (!isBrevoConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[Tailnote] Brevo contact sync skipped (not configured):', input.email);
    }
    return;
  }

  const email = input.email.trim().toLowerCase();
  if (!email) return;

  const attributes = parseName(input.name);
  const listId = getBrevoListId();

  const result = await brevoFetch('/contacts', {
    method: 'POST',
    json: {
      email,
      attributes,
      listIds: [listId],
      updateEnabled: true,
    },
  });

  if (!result.ok) {
    throw new Error(result.error);
  }
}
