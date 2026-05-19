export function inviteErrorMessage(error?: string, code?: string): string {
  if (code === 'email_not_configured') {
    return 'Employee created, but invitation email is not configured yet. Add BREVO_API_KEY and BREVO_SENDER_EMAIL in your deployment environment, then use Send invite below.';
  }
  if (error) return error;
  return 'Employee created, but the invitation email could not be sent. Use Send invite below once email is configured.';
}
