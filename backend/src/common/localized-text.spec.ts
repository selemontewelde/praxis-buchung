import { describe, expect, it } from 'vitest';
import { asLocalizedText } from './localized-text.js';

describe('asLocalizedText', () => {
  it('keeps the required locales and any optional ones that are present', () => {
    expect(asLocalizedText({ de: 'Hallo', en: 'Hello', fr: 'Salut' })).toEqual({
      de: 'Hallo',
      en: 'Hello',
      fr: 'Salut',
    });
  });

  it('drops optional locales that are missing or not strings', () => {
    expect(
      asLocalizedText({ de: 'Hallo', en: 'Hello', it: 42, es: null }),
    ).toEqual({ de: 'Hallo', en: 'Hello' });
  });

  it('returns null for a null, non-object, or array value', () => {
    expect(asLocalizedText(null)).toBeNull();
    expect(asLocalizedText('text')).toBeNull();
    expect(asLocalizedText(['de', 'en'])).toBeNull();
  });

  it('returns null when a required locale is missing', () => {
    expect(asLocalizedText({ de: 'Hallo' })).toBeNull();
    expect(asLocalizedText({ en: 'Hello' })).toBeNull();
  });
});
