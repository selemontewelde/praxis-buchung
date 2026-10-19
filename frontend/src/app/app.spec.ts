import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    // Start from the default language regardless of what other specs persisted,
    // so the shell renders German and this test is order-independent.
    try {
      localStorage.clear();
    } catch {
      // ignore (non-DOM environment)
    }
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the shell: skip link, navigation and footer', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.skip-link')?.textContent).toContain(
      'Zum Inhalt',
    );
    expect(el.querySelector('nav.site-nav')).toBeTruthy();
    expect(el.querySelector('.site-footer')).toBeTruthy();
  });
});
