import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../i18n/i18n.service';
import { AdminAuthService } from './admin-auth.service';
import { visibleSections } from './admin-sections';

// Admin landing: a greeting plus cards linking to the management sections.
// Navigation, theme toggle and logout live in the surrounding AdminLayout shell.
@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink],
  template: `
    <h1>{{ i18n.t('admin.title') }}</h1>
    <p class="who">{{ i18n.t('admin.loggedInAs') }} {{ auth.admin()?.email }}</p>

    <nav class="cards" [attr.aria-label]="i18n.t('admin.sections')">
      @for (section of sections(); track section.link) {
        <a class="card" [routerLink]="section.link">{{
          i18n.t(section.key)
        }}</a>
      }
    </nav>
  `,
  styles: `
    .who {
      color: var(--color-muted);
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .card {
      display: block;
      padding: 1.1rem 1.25rem;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      background: var(--color-surface);
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
    }
    .card:hover {
      border-color: var(--color-primary);
    }
    @media (prefers-reduced-motion: no-preference) {
      .card {
        transition:
          border-color 0.15s ease,
          transform 0.15s ease;
      }
      .card:hover {
        transform: translateY(-2px);
      }
    }
  `,
})
export class AdminDashboardPage {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AdminAuthService);
  protected readonly sections = computed(() =>
    visibleSections(this.auth.admin()?.role ?? 'THERAPIST'),
  );
}
