import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';
import type { TranslationKey } from './translations';

describe('I18nService', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({});
  });

  // Don't leak a persisted language choice into other spec files (shared storage).
  afterEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  });

  it('defaults to German', () => {
    const i18n = TestBed.inject(I18nService);
    expect(i18n.language()).toBe('de');
    expect(i18n.t('nav.home')).toBe('Start');
  });

  it('switches language and translates accordingly', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    expect(i18n.language()).toBe('en');
    expect(i18n.t('nav.home')).toBe('Home');
  });

  it('falls back to German for a missing key', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');
    // A key that exists in neither map returns the key itself (last-resort).
    expect(i18n.t('does.not.exist' as TranslationKey)).toBe('does.not.exist');
  });

  it('picks a bilingual value for the current language, German as fallback', () => {
    const i18n = TestBed.inject(I18nService);
    expect(i18n.pick('DE', 'EN')).toBe('DE');
    i18n.setLanguage('en');
    expect(i18n.pick('DE', 'EN')).toBe('EN');
    expect(i18n.pick('DE', null)).toBe('DE');
  });

  it('remembers the chosen language across instances', () => {
    TestBed.inject(I18nService).setLanguage('en');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(I18nService).language()).toBe('en');
  });

  it('supports additional languages beyond DE/EN', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('fr');
    expect(i18n.language()).toBe('fr');
    expect(i18n.t('nav.home')).toBe('Accueil');
    i18n.setLanguage('it');
    expect(i18n.t('nav.home')).toBe('Home');
    i18n.setLanguage('es');
    expect(i18n.t('nav.home')).toBe('Inicio');
  });

  it('shows the English DB value for a non-German UI language', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('fr');
    // DB content is only DE/EN, so a third language falls back to English.
    expect(i18n.pick('DE', 'EN')).toBe('EN');
  });

  it('remembers any supported language across instances', () => {
    TestBed.inject(I18nService).setLanguage('es');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(I18nService).language()).toBe('es');
  });

  it('falls back to the default for an unknown stored language', () => {
    try {
      localStorage.setItem('praxis.language', 'xx');
    } catch {
      // ignore
    }
    expect(TestBed.inject(I18nService).language()).toBe('de');
  });

  it('exposes each language endonym for the switcher', () => {
    const i18n = TestBed.inject(I18nService);
    expect(i18n.languageLabel('de')).toBe('Deutsch');
    expect(i18n.languageLabel('it')).toBe('Italiano');
    expect(i18n.languageLabel('es')).toBe('Español');
  });
});
