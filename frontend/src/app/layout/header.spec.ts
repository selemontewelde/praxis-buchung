import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../i18n/i18n.service';
import { LANGUAGES } from '../i18n/translations';
import { Header } from './header';

describe('Header language switcher', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  afterEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  });

  function select(fixture: { nativeElement: unknown }): HTMLSelectElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      'select.lang-select',
    ) as HTMLSelectElement;
  }

  it('renders one option per language, defaulting to German', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const el = select(fixture);
    expect(el.options.length).toBe(LANGUAGES.length);
    expect(el.value).toBe('de');
  });

  it('switches the language on change', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const i18n = TestBed.inject(I18nService);

    const el = select(fixture);
    el.value = 'fr';
    el.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(i18n.language()).toBe('fr');
  });
});
