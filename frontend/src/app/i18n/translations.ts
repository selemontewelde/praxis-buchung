/**
 * Static UI translations for the public site shell. German is the default and the
 * fallback (see I18nService). Keys are flat, dotted strings; `TranslationKey` is
 * derived from the German dictionary so every language must cover the same keys.
 */
export type Language = 'de' | 'en';

export const DEFAULT_LANGUAGE: Language = 'de';
export const LANGUAGES: readonly Language[] = ['de', 'en'];

const de = {
  'nav.home': 'Start',
  'nav.services': 'Leistungen',
  'nav.team': 'Team',
  'nav.contact': 'Kontakt',
  'nav.impressum': 'Impressum',
  'nav.privacy': 'Datenschutz',
  'nav.book': 'Termin buchen',
  'a11y.skipToContent': 'Zum Inhalt springen',
  'a11y.mainNav': 'Hauptnavigation',
  'a11y.footerNav': 'Rechtliches',
  'a11y.languageSwitch': 'Sprache wählen',
  'footer.rights': 'Alle Rechte vorbehalten.',
  'lang.de': 'Deutsch',
  'lang.en': 'English',
  'pages.home.title': 'Willkommen',
  'pages.services.title': 'Leistungen',
  'pages.team.title': 'Unser Team',
  'home.intro':
    'Willkommen in Ihrer Physiopraxis. Buchen Sie Ihren Termin bequem online.',
  'home.viewServices': 'Leistungen ansehen',
  'home.ourServices': 'Unsere Leistungen',
  'services.minutesShort': 'Min.',
  'team.empty': 'Zurzeit sind keine Teammitglieder verfügbar.',
  'pages.contact.title': 'Kontakt',
  'pages.impressum.title': 'Impressum',
  'pages.privacy.title': 'Datenschutz',
} as const;

export type TranslationKey = keyof typeof de;

const en: Record<TranslationKey, string> = {
  'nav.home': 'Home',
  'nav.services': 'Services',
  'nav.team': 'Team',
  'nav.contact': 'Contact',
  'nav.impressum': 'Imprint',
  'nav.privacy': 'Privacy',
  'nav.book': 'Book an appointment',
  'a11y.skipToContent': 'Skip to content',
  'a11y.mainNav': 'Main navigation',
  'a11y.footerNav': 'Legal',
  'a11y.languageSwitch': 'Choose language',
  'footer.rights': 'All rights reserved.',
  'lang.de': 'Deutsch',
  'lang.en': 'English',
  'pages.home.title': 'Welcome',
  'pages.services.title': 'Services',
  'pages.team.title': 'Our team',
  'home.intro':
    'Welcome to your physiotherapy practice. Book your appointment online.',
  'home.viewServices': 'View services',
  'home.ourServices': 'Our services',
  'services.minutesShort': 'min',
  'team.empty': 'No team members are available at the moment.',
  'pages.contact.title': 'Contact',
  'pages.impressum.title': 'Imprint',
  'pages.privacy.title': 'Privacy',
};

export const translations: Record<Language, Record<TranslationKey, string>> = {
  de,
  en,
};
