import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18nService } from '../i18n/i18n.service';
import { AdminAuthService } from './admin-auth.service';

// Admin landing. Management sections are added issue by issue (#19–#22).
@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink],
  template: `
    <h1>{{ i18n.t('admin.title') }}</h1>
    <p>{{ i18n.t('admin.loggedInAs') }} {{ auth.admin()?.email }}</p>
    <nav class="admin-nav">
      <a routerLink="/admin/therapists">{{ i18n.t('adminTherapists.nav') }}</a>
    </nav>
    <button type="button" (click)="logout()">{{ i18n.t('admin.logout') }}</button>
  `,
  styles: `
    button {
      background: var(--color-primary);
      color: #fff;
      border: 0;
      border-radius: 999px;
      padding: 0.55rem 1.1rem;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
  `,
})
export class AdminDashboardPage {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/admin/login');
  }
}
