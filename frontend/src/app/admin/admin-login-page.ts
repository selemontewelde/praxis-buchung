import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../i18n/i18n.service';
import { AdminAuthService } from './admin-auth.service';

@Component({
  selector: 'app-admin-login-page',
  template: `
    <h1>{{ i18n.t('admin.loginTitle') }}</h1>
    <form class="login" (submit)="$event.preventDefault(); submit()">
      <label>
        <span>{{ i18n.t('admin.emailLabel') }}</span>
        <input
          type="email"
          [value]="email()"
          (input)="email.set($any($event.target).value)"
          autocomplete="username"
        />
      </label>
      <label>
        <span>{{ i18n.t('admin.passwordLabel') }}</span>
        <input
          type="password"
          [value]="password()"
          (input)="password.set($any($event.target).value)"
          autocomplete="current-password"
        />
      </label>

      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }

      <button type="submit" [disabled]="submitting()">
        {{ submitting() ? i18n.t('admin.loggingIn') : i18n.t('admin.loginButton') }}
      </button>
    </form>
  `,
  styles: `
    .login {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 22rem;
      margin-top: 1rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    input {
      padding: 0.45rem 0.6rem;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font: inherit;
    }
    .error {
      color: #b91c1c;
    }
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
export class AdminLoginPage {
  protected readonly i18n = inject(I18nService);
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);

  protected async submit(): Promise<void> {
    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.email().trim(), this.password());
      await this.router.navigateByUrl('/admin');
    } catch {
      this.error.set(this.i18n.t('admin.loginFailed'));
    } finally {
      this.submitting.set(false);
    }
  }
}
