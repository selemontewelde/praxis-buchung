import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PracticeService } from '../core/practice.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <a class="brand" routerLink="/">
        @if (practice.branding(); as b) {
          <img
            class="brand-logo"
            [src]="b.logoPath"
            [alt]="b.name"
            width="36"
            height="36"
          />
          <span class="brand-name">{{ b.name }}</span>
        } @else {
          <span class="brand-name">praxis-buchung</span>
        }
      </a>

      <nav class="site-nav" [attr.aria-label]="i18n.t('a11y.mainNav')">
        <a
          routerLink="/"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          >{{ i18n.t('nav.home') }}</a
        >
        <a routerLink="/leistungen" routerLinkActive="active">{{
          i18n.t('nav.services')
        }}</a>
        <a routerLink="/team" routerLinkActive="active">{{
          i18n.t('nav.team')
        }}</a>
        <a routerLink="/kontakt" routerLinkActive="active">{{
          i18n.t('nav.contact')
        }}</a>
        <a class="nav-book" routerLink="/termin" routerLinkActive="active">{{
          i18n.t('nav.book')
        }}</a>
      </nav>

      <span class="lang-switch">
        <!-- Decorative globe: signals "language" without country flags (flags are
             not languages, and a native <option> can't render icons anyway). -->
        <svg
          class="lang-globe"
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path
            d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
          />
        </svg>
        <select
          class="lang-select"
          [attr.aria-label]="i18n.t('a11y.languageSwitch')"
          [value]="i18n.language()"
          (change)="i18n.setLanguage($any($event.target).value)"
        >
          @for (lang of i18n.languages; track lang) {
            <option [value]="lang">{{ i18n.languageLabel(lang) }}</option>
          }
        </select>
      </span>
    </header>
  `,
  styles: `
    .site-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem 1.5rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      color: var(--color-primary);
      text-decoration: none;
    }
    .brand-logo {
      display: block;
      height: 36px;
      width: auto;
    }
    .site-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 1rem;
      margin-inline-end: auto;
    }
    .site-nav a {
      color: var(--color-text);
      text-decoration: none;
      padding: 0.35rem 0.25rem;
      border-bottom: 2px solid transparent;
    }
    .site-nav a:hover {
      border-bottom-color: var(--color-accent);
    }
    .site-nav a.active {
      border-bottom-color: var(--color-primary);
      font-weight: 600;
    }
    .site-nav a.nav-book {
      background: var(--color-primary);
      color: #fff;
      border-radius: 999px;
      padding: 0.3rem 0.8rem;
      border-bottom: 0;
    }
    .lang-switch {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--color-muted);
    }
    .lang-globe {
      flex: none;
    }
    .lang-select {
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      border-radius: 999px;
      padding: 0.25rem 0.7rem;
      cursor: pointer;
      font: inherit;
    }
  `,
})
export class Header {
  protected readonly i18n = inject(I18nService);
  protected readonly practice = inject(PracticeService);
}
