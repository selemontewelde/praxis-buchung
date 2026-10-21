import { Injectable, signal } from '@angular/core';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  type Language,
  localeFor,
  type TranslationKey,
  translations,
} from './translations';

const STORAGE_KEY = 'praxis.language';

/**
 * Runtime i18n for the public site, built on a signal instead of a third-party
 * library (Angular's built-in i18n is compile-time, and a two-language site does
 * not need more). German is the default and the fallback.
 *
 * `t()` reads the `language` signal, so any template binding that calls it is
 * tracked and updates automatically when the language changes — no pipe needed.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _language = signal<Language>(this.readStoredLanguage());
  readonly language = this._language.asReadonly();
  readonly languages = LANGUAGES;

  constructor() {
    this.reflectOnDocument(this._language());
  }

  setLanguage(language: Language): void {
    this._language.set(language);
    this.reflectOnDocument(language);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Private mode / blocked storage: the choice simply isn't remembered.
    }
  }

  /** The display name (endonym) of a language, for the language switcher. */
  languageLabel(language: Language): string {
    return this.t(`lang.${language}` as TranslationKey);
  }

  /**
   * The BCP-47 locale for the current language, for `Intl` date/time formatting.
   * Reads the language signal, so bindings that call it re-render on a switch.
   */
  locale(): string {
    return localeFor(this._language());
  }

  /** Translate a key in the current language, falling back to German, then the key. */
  t(key: TranslationKey): string {
    const language = this._language();
    return (
      translations[language][key] ?? translations[DEFAULT_LANGUAGE][key] ?? key
    );
  }

  /**
   * Pick a bilingual value (e.g. a service description) for the current language.
   * DB-backed content is stored only in German and English (see ADR-0005), so a
   * third UI language (fr/it/es) shows the English value, with German as the
   * last-resort fallback. Reads the language signal, so bindings that call it
   * re-render on a language switch.
   */
  pick(de: string | null | undefined, en: string | null | undefined): string {
    const value = this._language() === 'de' ? de : en;
    return value ?? de ?? '';
  }

  private reflectOnDocument(language: Language): void {
    try {
      document.documentElement.lang = language;
    } catch {
      // No document (e.g. during a unit test in a non-DOM environment).
    }
  }

  private readStoredLanguage(): Language {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Validate against the supported set, so adding a language needs no change
      // here and a stale/unknown stored value falls back to the default.
      if (stored !== null && (LANGUAGES as readonly string[]).includes(stored)) {
        return stored as Language;
      }
    } catch {
      // Ignore and use the default.
    }
    return DEFAULT_LANGUAGE;
  }
}
