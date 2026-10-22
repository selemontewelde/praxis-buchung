import { Component, computed, inject, signal } from '@angular/core';
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

    <section class="password">
      <h2>{{ i18n.t('adminPassword.title') }}</h2>
      <form (submit)="$event.preventDefault(); changePassword()">
        <label>
          <span>{{ i18n.t('adminPassword.current') }}</span>
          <input type="password" [value]="current()" (input)="current.set($any($event.target).value)" />
        </label>
        <label>
          <span>{{ i18n.t('adminPassword.new') }}</span>
          <input type="password" [value]="next()" (input)="next.set($any($event.target).value)" />
        </label>
        <button type="submit" [disabled]="current() === '' || next() === ''">
          {{ i18n.t('adminPassword.submit') }}
        </button>
      </form>
      @if (notice(); as n) { <p class="notice">{{ n }}</p> }
      @if (error(); as e) { <p class="error">{{ e }}</p> }
    </section>
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
    .password {
      margin-top: 2rem;
    }
    .password form {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: end;
    }
    .password label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .password input {
      padding: 0.35rem 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font: inherit;
    }
    .password button {
      background: var(--color-primary);
      color: #fff;
      border: 0;
      border-radius: 999px;
      padding: 0.35rem 0.9rem;
      font: inherit;
      cursor: pointer;
    }
    .password button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .notice {
      color: var(--color-primary);
    }
    .error {
      color: #b91c1c;
    }
  `,
})
export class AdminDashboardPage {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AdminAuthService);
  protected readonly sections = computed(() =>
    visibleSections(this.auth.admin()?.role ?? 'THERAPIST'),
  );

  protected readonly current = signal('');
  protected readonly next = signal('');
  protected readonly notice = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected async changePassword(): Promise<void> {
    if (this.current() === '' || this.next() === '') return;
    this.notice.set(null);
    this.error.set(null);
    try {
      await this.auth.changePassword(this.current(), this.next());
      this.current.set('');
      this.next.set('');
      this.notice.set(this.i18n.t('adminPassword.changed'));
    } catch {
      this.error.set(this.i18n.t('adminPassword.error'));
    }
  }
}
