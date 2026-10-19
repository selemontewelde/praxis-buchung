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

      <div
        class="lang-switch"
        role="group"
        [attr.aria-label]="i18n.t('a11y.languageSwitch')"
      >
        @for (lang of i18n.languages; track lang) {
          <button
            type="button"
            [class.active]="i18n.language() === lang"
            [attr.aria-pressed]="i18n.language() === lang"
            (click)="i18n.setLanguage(lang)"
          >
            {{ lang === 'de' ? i18n.t('lang.de') : i18n.t('lang.en') }}
          </button>
        }
      </div>
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
      gap: 0.25rem;
    }
    .lang-switch button {
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text);
      border-radius: 999px;
      padding: 0.25rem 0.7rem;
      cursor: pointer;
      font: inherit;
    }
    .lang-switch button.active {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary);
    }
  `,
})
export class Header {
  protected readonly i18n = inject(I18nService);
  protected readonly practice = inject(PracticeService);
}
