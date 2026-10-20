import { Component, effect, inject, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PracticeService } from '../core/practice.service';
import { I18nService } from '../i18n/i18n.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminThemeService } from './admin-theme.service';

/**
 * Shell for the whole admin area: a dedicated top bar (brand, section nav, theme
 * toggle, logout) and a `<router-outlet>` for the admin pages. It is the parent
 * route of `/admin/*`, so it stays mounted while navigating between sections and
 * every admin page gets consistent navigation.
 *
 * Theming works through CSS custom properties: the Solarized dark/light tokens are
 * declared in the global stylesheet under `body[data-admin-theme='…']`, and this
 * shell reflects the current theme onto `<body>` while it is alive. Because custom
 * properties inherit down the DOM, every admin page re-skins automatically. The
 * attribute is removed on destroy, so leaving the admin area restores the public
 * (light, practice-branded) theme.
 */
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">
      <header class="admin-topbar">
        <span class="admin-brand">{{ practice.branding()?.name ?? 'Admin' }}</span>

        <nav class="admin-nav" [attr.aria-label]="i18n.t('admin.sections')">
          <a
            routerLink="/admin"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            >{{ i18n.t('admin.nav.overview') }}</a
          >
          <a routerLink="/admin/therapists" routerLinkActive="active">{{
            i18n.t('adminTherapists.nav')
          }}</a>
          <a routerLink="/admin/hours" routerLinkActive="active">{{
            i18n.t('adminHours.nav')
          }}</a>
          <a routerLink="/admin/blocks" routerLinkActive="active">{{
            i18n.t('adminBlocks.nav')
          }}</a>
          <a routerLink="/admin/services" routerLinkActive="active">{{
            i18n.t('adminServices.nav')
          }}</a>
          <a routerLink="/admin/appointments" routerLinkActive="active">{{
            i18n.t('adminAppointments.nav')
          }}</a>
        </nav>

        <div class="admin-actions">
          <button
            type="button"
            class="theme-toggle"
            [attr.aria-label]="i18n.t('admin.themeToggle')"
            [attr.aria-pressed]="theme.theme() === 'dark'"
            (click)="theme.toggle()"
          >
            {{
              theme.theme() === 'dark'
                ? i18n.t('admin.themeLight')
                : i18n.t('admin.themeDark')
            }}
          </button>
          <button type="button" class="logout" (click)="logout()">
            {{ i18n.t('admin.logout') }}
          </button>
        </div>
      </header>

      <div class="admin-main">
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .admin-shell {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .admin-topbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }
    .admin-brand {
      font-weight: 700;
      color: var(--color-primary);
    }
    .admin-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.5rem;
      margin-inline-end: auto;
    }
    .admin-nav a {
      color: var(--color-text);
      text-decoration: none;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      border: 1px solid transparent;
    }
    .admin-nav a:hover {
      border-color: var(--color-border);
    }
    .admin-nav a.active {
      background: var(--color-primary);
      color: var(--color-surface);
      font-weight: 600;
    }
    .admin-actions {
      display: inline-flex;
      gap: 0.5rem;
    }
    .admin-actions button {
      font: inherit;
      cursor: pointer;
      border-radius: 999px;
      padding: 0.4rem 0.9rem;
    }
    .theme-toggle {
      background: transparent;
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }
    .logout {
      background: var(--color-primary);
      color: var(--color-surface);
      border: 1px solid var(--color-primary);
      font-weight: 600;
    }

    /* Tasteful, optional motion — suppressed for users who ask for less. */
    @media (prefers-reduced-motion: no-preference) {
      .admin-nav a,
      .admin-actions button {
        transition:
          background-color 0.15s ease,
          border-color 0.15s ease,
          color 0.15s ease;
      }
      .admin-main {
        animation: admin-fade-in 0.25s ease both;
      }
      @keyframes admin-fade-in {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    }
  `,
})
export class AdminLayout implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  protected readonly practice = inject(PracticeService);
  protected readonly auth = inject(AdminAuthService);
  protected readonly theme = inject(AdminThemeService);
  private readonly router = inject(Router);

  constructor() {
    // Reflect the admin theme onto <body> so the Solarized tokens (declared in
    // the global stylesheet) cascade to every admin page and the full viewport.
    effect(() => {
      const theme = this.theme.theme();
      try {
        document.body.setAttribute('data-admin-theme', theme);
      } catch {
        // No document (non-DOM unit test): theming is a no-op.
      }
    });
  }

  ngOnDestroy(): void {
    // Leaving the admin area restores the public, practice-branded theme.
    try {
      document.body.removeAttribute('data-admin-theme');
    } catch {
      // No document: nothing to clean up.
    }
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/admin/login');
  }
}
