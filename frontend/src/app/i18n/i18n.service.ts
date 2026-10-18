import { Injectable, signal } from '@angular/core';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  type Language,
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

  /** Translate a key in the current language, falling back to German, then the key. */
  t(key: TranslationKey): string {
    const language = this._language();
    return (
      translations[language][key] ?? translations[DEFAULT_LANGUAGE][key] ?? key
    );
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
      if (stored === 'de' || stored === 'en') {
        return stored;
      }
    } catch {
      // Ignore and use the default.
    }
    return DEFAULT_LANGUAGE;
  }
}
