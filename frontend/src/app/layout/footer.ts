import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PracticeService } from '../core/practice.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <nav class="footer-nav" [attr.aria-label]="i18n.t('a11y.footerNav')">
        <a routerLink="/impressum">{{ i18n.t('nav.impressum') }}</a>
        <a routerLink="/datenschutz">{{ i18n.t('nav.privacy') }}</a>
      </nav>
      <p class="footer-legal">
        © {{ year }} {{ owner() }}. {{ i18n.t('footer.rights') }}
      </p>
    </footer>
  `,
  styles: `
    .site-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem 1.5rem;
      padding: 1.25rem 1rem;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-muted);
      font-size: 0.9rem;
    }
    .footer-nav {
      display: flex;
      gap: 1rem;
    }
    .footer-nav a {
      color: var(--color-text);
      text-decoration: none;
    }
    .footer-nav a:hover {
      text-decoration: underline;
    }
    .footer-legal {
      margin: 0;
    }
  `,
})
export class Footer {
  protected readonly i18n = inject(I18nService);
  protected readonly practice = inject(PracticeService);
  protected readonly year = new Date().getFullYear();

  protected owner(): string {
    return this.practice.legal()?.owner ?? this.practice.branding()?.name ?? '';
  }
}
