import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import type { AdminRole } from './admin-auth.service';
import { type AdminUser, AdminUserApiService } from './admin-user-api.service';
import { AdminTherapistApiService } from './admin-therapist-api.service';

const ROLES: AdminRole[] = ['ADMIN', 'THERAPIST'];

/**
 * ADMIN-only management of back-office logins: create, relink/retype, delete.
 * Password change/reset is out of scope here (see #128); create sets an initial
 * password. The route is registered as an adminOnly section, so a THERAPIST never
 * sees it, and the backend also enforces ADMIN.
 */
@Component({
  selector: 'app-admin-users-page',
  imports: [],
  template: `
    <h1>{{ i18n.t('adminUsers.title') }}</h1>

    <form class="add" (submit)="$event.preventDefault(); create()">
      <label>
        <span>{{ i18n.t('adminUsers.email') }}</span>
        <input type="email" [value]="email()" (input)="email.set($any($event.target).value)" />
      </label>
      <label>
        <span>{{ i18n.t('adminUsers.password') }}</span>
        <input
          type="password"
          [value]="password()"
          (input)="password.set($any($event.target).value)"
        />
      </label>
      <label>
        <span>{{ i18n.t('adminUsers.role') }}</span>
        <select [value]="role()" (change)="role.set($any($event.target).value)">
          @for (r of roles; track r) {
            <option [value]="r">{{ i18n.t($any('adminUsers.role.' + r)) }}</option>
          }
        </select>
      </label>
      @if (role() === 'THERAPIST') {
        <label>
          <span>{{ i18n.t('adminUsers.therapist') }}</span>
          <select [value]="newTherapist()" (change)="newTherapist.set($any($event.target).value)">
            <option value="">—</option>
            @for (t of therapists(); track t.id) {
              <option [value]="t.id">{{ t.name }}</option>
            }
          </select>
        </label>
      }
      <button type="submit" [disabled]="!canCreate()">{{ i18n.t('adminUsers.add') }}</button>
    </form>

    @if (error(); as e) {
      <p class="error">{{ e }}</p>
    }

    <ul class="user-list">
      @for (u of users(); track u.id) {
        <li>
          <span class="email">{{ u.email }}</span>
          <select [value]="u.role" (change)="changeRole(u, $any($event.target).value)">
            @for (r of roles; track r) {
              <option [value]="r">{{ i18n.t($any('adminUsers.role.' + r)) }}</option>
            }
          </select>
          @if (u.role === 'THERAPIST') {
            <select
              [value]="u.therapistId ?? ''"
              (change)="changeTherapist(u, $any($event.target).value)"
            >
              <option value="">—</option>
              @for (t of therapists(); track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
          }
          <button type="button" class="delete" (click)="remove(u)">
            {{ i18n.t('adminUsers.delete') }}
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    .add {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: end;
      margin: 1rem 0 1rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    input,
    select {
      padding: 0.35rem 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font: inherit;
    }
    button {
      background: var(--color-primary);
      color: #fff;
      border: 0;
      border-radius: 999px;
      padding: 0.35rem 0.9rem;
      font: inherit;
      cursor: pointer;
    }
    button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .error {
      color: #b91c1c;
    }
    .user-list {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    .user-list li {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .user-list .email {
      font-weight: 600;
      margin-right: auto;
    }
    .user-list .delete {
      background: transparent;
      color: #b91c1c;
      border: 1px solid var(--color-border);
    }
  `,
})
export class AdminUsersPage {
  protected readonly i18n = inject(I18nService);
  private readonly api = inject(AdminUserApiService);
  private readonly therapistApi = inject(AdminTherapistApiService);

  protected readonly roles = ROLES;
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly therapists = signal<{ id: string; name: string }[]>([]);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly role = signal<AdminRole>('ADMIN');
  protected readonly newTherapist = signal('');
  protected readonly error = signal<string | null>(null);

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    const list = await this.therapistApi.list();
    this.therapists.set(list.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` })));
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.users.set(await this.api.list());
  }

  protected canCreate(): boolean {
    if (this.email() === '' || this.password() === '') return false;
    return this.role() === 'ADMIN' || this.newTherapist() !== '';
  }

  protected async create(): Promise<void> {
    if (!this.canCreate()) return;
    await this.run(async () => {
      await this.api.create({
        email: this.email(),
        password: this.password(),
        role: this.role(),
        ...(this.role() === 'THERAPIST' ? { therapistId: this.newTherapist() } : {}),
      });
      this.email.set('');
      this.password.set('');
      this.role.set('ADMIN');
      this.newTherapist.set('');
    });
  }

  protected async changeRole(user: AdminUser, role: AdminRole): Promise<void> {
    // Becoming a THERAPIST needs a therapist: keep the current one, else default
    // to the first available (the admin can then adjust). ADMIN clears the link.
    const therapistId =
      role === 'THERAPIST' ? (user.therapistId ?? this.therapists()[0]?.id ?? null) : null;
    await this.run(() => this.api.update(user.id, { role, therapistId }));
  }

  protected async changeTherapist(user: AdminUser, therapistId: string): Promise<void> {
    await this.run(() =>
      this.api.update(user.id, {
        role: 'THERAPIST',
        therapistId: therapistId === '' ? null : therapistId,
      }),
    );
  }

  protected async remove(user: AdminUser): Promise<void> {
    await this.run(() => this.api.remove(user.id));
  }

  /** Run a mutation, surface a backend error message inline, and reload. */
  private async run(action: () => Promise<unknown>): Promise<void> {
    this.error.set(null);
    try {
      await action();
    } catch (err: unknown) {
      this.error.set(this.messageOf(err));
    }
    await this.reload();
  }

  private messageOf(err: unknown): string {
    const body = (err as { error?: { message?: unknown } }).error;
    const msg = body?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0];
    return this.i18n.t('adminUsers.error');
  }
}
