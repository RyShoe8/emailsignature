import { redirect } from 'next/navigation';

/** Old Settings URL; organization controls live on Overview. */
export default function SettingsRedirectPage() {
  redirect('/dashboard');
}
