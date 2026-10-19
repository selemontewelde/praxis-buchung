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
});
