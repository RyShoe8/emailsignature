function capitalize(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Best-effort first/last name from an email local part (e.g. john.doe@co.com). */
export function nameFromEmail(email: string): { firstName: string; lastName: string } {
  const local = email.split('@')[0]?.trim() ?? '';
  const parts = local
    .replace(/[._+-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(capitalize);

  if (parts.length >= 2) {
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return { firstName: 'New', lastName: '' };
}
