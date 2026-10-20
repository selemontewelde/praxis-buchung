/** Formats a UTC ISO instant for display in the admin UI, localised by language. */
export function formatInstant(iso: string, language: string): string {
  return new Intl.DateTimeFormat(language === 'de' ? 'de-CH' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
