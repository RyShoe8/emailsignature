/**
 * Curated email-signature font options with proper fallback stacks.
 *
 * Email font support:
 * - **Web-safe**: Pre-installed on virtually all OS. Render in Gmail, Outlook, Apple Mail, etc.
 * - **Google Fonts**: Best-effort. Apple Mail renders them; Gmail/Outlook fall back to the
 *   stack's next font. The engine always appends `, Arial, Helvetica, sans-serif` or
 *   `, Georgia, 'Times New Roman', serif` at the end.
 *
 * Every font stack ends with a generic family so email clients have a guaranteed fallback.
 */

export type FontOption = {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Category for grouping in the UI */
  category: 'web-safe-sans' | 'web-safe-serif' | 'google-sans' | 'google-serif' | 'google-display';
  /** CSS font-family stack string (used directly in the engine) */
  stack: string;
};

/**
 * Web-safe fonts — guaranteed to render in all major email clients.
 */
const WEB_SAFE_SANS: FontOption[] = [
  { id: 'arial', name: 'Arial', category: 'web-safe-sans', stack: 'Arial, Helvetica, sans-serif' },
  { id: 'helvetica', name: 'Helvetica', category: 'web-safe-sans', stack: 'Helvetica, Arial, sans-serif' },
  { id: 'verdana', name: 'Verdana', category: 'web-safe-sans', stack: 'Verdana, Geneva, sans-serif' },
  { id: 'tahoma', name: 'Tahoma', category: 'web-safe-sans', stack: 'Tahoma, Geneva, sans-serif' },
  { id: 'trebuchet', name: 'Trebuchet MS', category: 'web-safe-sans', stack: "'Trebuchet MS', Helvetica, sans-serif" },
  { id: 'calibri', name: 'Calibri', category: 'web-safe-sans', stack: 'Calibri, Arial, Helvetica, sans-serif' },
  { id: 'segoe-ui', name: 'Segoe UI', category: 'web-safe-sans', stack: "'Segoe UI', Tahoma, Geneva, sans-serif" },
];

const WEB_SAFE_SERIF: FontOption[] = [
  { id: 'georgia', name: 'Georgia', category: 'web-safe-serif', stack: "Georgia, 'Times New Roman', serif" },
  { id: 'times-new-roman', name: 'Times New Roman', category: 'web-safe-serif', stack: "'Times New Roman', Times, serif" },
  { id: 'garamond', name: 'Garamond', category: 'web-safe-serif', stack: "Garamond, Georgia, 'Times New Roman', serif" },
  { id: 'palatino', name: 'Palatino', category: 'web-safe-serif', stack: "'Palatino Linotype', Palatino, Georgia, serif" },
  { id: 'book-antiqua', name: 'Book Antiqua', category: 'web-safe-serif', stack: "'Book Antiqua', Palatino, Georgia, serif" },
];

/**
 * Google Fonts — best-effort rendering. Apple Mail + some Android/web clients render these.
 * Gmail and Outlook fall back to the next font in the stack.
 */
const GOOGLE_SANS: FontOption[] = [
  { id: 'inter', name: 'Inter', category: 'google-sans', stack: 'Inter, Arial, Helvetica, sans-serif' },
  { id: 'roboto', name: 'Roboto', category: 'google-sans', stack: 'Roboto, Arial, Helvetica, sans-serif' },
  { id: 'open-sans', name: 'Open Sans', category: 'google-sans', stack: "'Open Sans', Arial, Helvetica, sans-serif" },
  { id: 'lato', name: 'Lato', category: 'google-sans', stack: 'Lato, Arial, Helvetica, sans-serif' },
  { id: 'montserrat', name: 'Montserrat', category: 'google-sans', stack: 'Montserrat, Arial, Helvetica, sans-serif' },
  { id: 'poppins', name: 'Poppins', category: 'google-sans', stack: 'Poppins, Arial, Helvetica, sans-serif' },
  { id: 'raleway', name: 'Raleway', category: 'google-sans', stack: 'Raleway, Arial, Helvetica, sans-serif' },
  { id: 'nunito', name: 'Nunito', category: 'google-sans', stack: 'Nunito, Arial, Helvetica, sans-serif' },
  { id: 'work-sans', name: 'Work Sans', category: 'google-sans', stack: "'Work Sans', Arial, Helvetica, sans-serif" },
  { id: 'dm-sans', name: 'DM Sans', category: 'google-sans', stack: "'DM Sans', Arial, Helvetica, sans-serif" },
  { id: 'manrope', name: 'Manrope', category: 'google-sans', stack: 'Manrope, Arial, Helvetica, sans-serif' },
  { id: 'rubik', name: 'Rubik', category: 'google-sans', stack: 'Rubik, Arial, Helvetica, sans-serif' },
  { id: 'outfit', name: 'Outfit', category: 'google-sans', stack: 'Outfit, Arial, Helvetica, sans-serif' },
];

const GOOGLE_SERIF: FontOption[] = [
  { id: 'merriweather', name: 'Merriweather', category: 'google-serif', stack: "Merriweather, Georgia, 'Times New Roman', serif" },
  { id: 'playfair', name: 'Playfair Display', category: 'google-serif', stack: "'Playfair Display', Georgia, serif" },
  { id: 'pt-serif', name: 'PT Serif', category: 'google-serif', stack: "'PT Serif', Georgia, 'Times New Roman', serif" },
];

export const FONT_OPTIONS: FontOption[] = [
  ...WEB_SAFE_SANS,
  ...WEB_SAFE_SERIF,
  ...GOOGLE_SANS,
  ...GOOGLE_SERIF,
];

/** Grouped for UI rendering */
export const FONT_GROUPS = [
  { label: 'Web-Safe Sans-Serif', fonts: WEB_SAFE_SANS },
  { label: 'Web-Safe Serif', fonts: WEB_SAFE_SERIF },
  { label: 'Google Fonts (Sans-Serif)', fonts: GOOGLE_SANS },
  { label: 'Google Fonts (Serif)', fonts: GOOGLE_SERIF },
] as const;

/** Find a font by id, falling back to Arial. */
export function findFontById(id: string): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
}

/** Find a font by its stack string (for matching existing org.fontFamily values). */
export function findFontByStack(stack: string): FontOption | undefined {
  const s = stack.trim();
  // Exact match first
  const exact = FONT_OPTIONS.find((f) => f.stack === s);
  if (exact) return exact;
  // Try matching the primary font name (first part of the stack)
  const primary = s.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
  return FONT_OPTIONS.find((f) => f.name.toLowerCase() === primary);
}
