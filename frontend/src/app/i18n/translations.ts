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

  'legal.disclaimer':
    'Diese Angaben sind eine Vorlage und von der Praxis rechtlich zu prüfen.',

  'contact.addressHeading': 'Adresse',
  'contact.phoneHeading': 'Telefon',
  'contact.emailHeading': 'E-Mail',

  'impressum.responsibleHeading': 'Verantwortlich',
  'impressum.contactHeading': 'Kontakt',

  'privacy.version': 'Stand',
  'privacy.intro':
    'Der Schutz Ihrer Personendaten ist uns wichtig. Wir bearbeiten Personendaten nach dem schweizerischen Datenschutzgesetz (revDSG).',
  'privacy.dataHeading': 'Welche Daten wir bearbeiten',
  'privacy.data':
    'Für die Terminbuchung bearbeiten wir ausschliesslich Name, Kontaktangaben (E-Mail, Telefon) sowie Termindaten. Es werden keine Gesundheitsdaten erhoben.',
  'privacy.purposeHeading': 'Zweck',
  'privacy.purpose':
    'Die Daten dienen allein der Vereinbarung, Bestätigung und Verwaltung Ihrer Termine.',
  'privacy.retentionHeading': 'Aufbewahrung',
  'privacy.retention':
    'Wir bewahren die Daten nur so lange auf, wie es für diesen Zweck erforderlich ist.',
  'privacy.rightsHeading': 'Ihre Rechte',
  'privacy.rights':
    'Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer Personendaten. Wenden Sie sich dazu an die unten genannte Kontaktadresse.',
  'privacy.contactHeading': 'Kontakt für Datenschutzanfragen',

  'booking.serviceLabel': 'Leistung',
  'booking.therapistLabel': 'Therapeut:in',
  'booking.anyTherapist': 'Egal',
  'booking.dateLabel': 'Datum',
  'booking.showSlots': 'Freie Zeiten anzeigen',
  'booking.noSlots': 'An diesem Tag sind keine Zeiten frei.',
  'booking.chooseTime': 'Zeit wählen',
  'booking.nameLabel': 'Name',
  'booking.emailLabel': 'E-Mail',
  'booking.phoneLabel': 'Telefon',
  'booking.consentLabel': 'Ich stimme der Datenschutzerklärung zu.',
  'booking.submit': 'Verbindlich buchen',
  'booking.submitting': 'Wird gebucht…',
  'booking.confirmedTitle': 'Termin bestätigt',
  'booking.confirmedLead': 'Vielen Dank. Ihr Termin:',
  'booking.bookAnother': 'Weiteren Termin buchen',
  'booking.failed': 'Buchung fehlgeschlagen. Bitte versuchen Sie es erneut.',
  'booking.slotUnavailable':
    'Dieser Termin ist nicht mehr verfügbar. Bitte wählen Sie eine andere Zeit.',
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

  'legal.disclaimer':
    'This content is a template and must be legally reviewed by the practice.',

  'contact.addressHeading': 'Address',
  'contact.phoneHeading': 'Phone',
  'contact.emailHeading': 'Email',

  'impressum.responsibleHeading': 'Responsible',
  'impressum.contactHeading': 'Contact',

  'privacy.version': 'Version',
  'privacy.intro':
    'The protection of your personal data matters to us. We process personal data in accordance with the Swiss Data Protection Act (revDSG).',
  'privacy.dataHeading': 'What data we process',
  'privacy.data':
    'For appointment booking we process only your name, contact details (email, phone) and appointment data. No health data is collected.',
  'privacy.purposeHeading': 'Purpose',
  'privacy.purpose':
    'The data is used solely to arrange, confirm and manage your appointments.',
  'privacy.retentionHeading': 'Retention',
  'privacy.retention':
    'We keep the data only for as long as necessary for this purpose.',
  'privacy.rightsHeading': 'Your rights',
  'privacy.rights':
    'You have the right to access, correct and delete your personal data. To exercise these rights, contact the address below.',
  'privacy.contactHeading': 'Contact for data protection requests',

  'booking.serviceLabel': 'Service',
  'booking.therapistLabel': 'Therapist',
  'booking.anyTherapist': 'Any',
  'booking.dateLabel': 'Date',
  'booking.showSlots': 'Show available times',
  'booking.noSlots': 'No times available on this day.',
  'booking.chooseTime': 'Choose a time',
  'booking.nameLabel': 'Name',
  'booking.emailLabel': 'Email',
  'booking.phoneLabel': 'Phone',
  'booking.consentLabel': 'I agree to the privacy policy.',
  'booking.submit': 'Book',
  'booking.submitting': 'Booking…',
  'booking.confirmedTitle': 'Appointment confirmed',
  'booking.confirmedLead': 'Thank you. Your appointment:',
  'booking.bookAnother': 'Book another appointment',
  'booking.failed': 'Booking failed. Please try again.',
  'booking.slotUnavailable':
    'This slot is no longer available. Please choose another time.',
};

export const translations: Record<Language, Record<TranslationKey, string>> = {
  de,
  en,
};
