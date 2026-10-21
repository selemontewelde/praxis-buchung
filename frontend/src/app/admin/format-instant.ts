import { type Language, localeFor } from '../i18n/translations';

/** Formats a UTC ISO instant for display in the admin UI, localised by language. */
export function formatInstant(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
