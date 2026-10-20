import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import {
  type AdminAppointment,
  AdminAppointmentApiService,
  type AppointmentScope,
} from './admin-appointment-api.service';
import { formatInstant } from './format-instant';

@Component({
  selector: 'app-admin-appointments-page',
  template: `
    <h1>{{ i18n.t('adminAppointments.title') }}</h1>

    <div class="tabs">
      <button
        type="button"
        [class.active]="scope() === 'upcoming'"
        (click)="setScope('upcoming')"
      >
        {{ i18n.t('adminAppointments.upcoming') }}
      </button>
      <button
        type="button"
        [class.active]="scope() === 'past'"
        (click)="setScope('past')"
      >
        {{ i18n.t('adminAppointments.past') }}
      </button>
    </div>

    @if (appointments().length === 0) {
      <p>{{ i18n.t('adminAppointments.none') }}</p>
    } @else {
      <ul class="appt-list">
        @for (a of appointments(); track a.id) {
          <li [class.cancelled]="a.status === 'CANCELLED'">
            <span class="when">{{ format(a.startAt) }}</span>
            <strong>{{ a.patientName }}</strong>
            <span>{{ a.patientEmail }} · {{ a.patientPhone }}</span>
            <span>{{ a.serviceName }} · {{ a.therapistName }}</span>
            <span class="badge">{{ i18n.t($any('appointmentStatus.' + a.status)) }}</span>
            @if (a.status === 'BOOKED' && scope() === 'upcoming') {
              <button type="button" (click)="cancel(a.id)">
                {{ i18n.t('adminAppointments.cancel') }}
              </button>
            }
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .tabs { display: flex; gap: 0.5rem; margin: 1rem 0 1.5rem; }
    .tabs button { background: transparent; color: inherit; border: 1px solid var(--color-border); border-radius: 999px; padding: 0.3rem 0.9rem; font: inherit; cursor: pointer; }
    .tabs button.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .appt-list { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
    .appt-list li { border: 1px solid var(--color-border); border-radius: 8px; padding: 0.5rem 0.75rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .appt-list li.cancelled { opacity: 0.55; }
    .when { font-variant-numeric: tabular-nums; }
    .badge { font-size: 0.8rem; color: var(--color-primary); }
    .appt-list button { margin-left: auto; background: transparent; color: #b91c1c; border: 1px solid var(--color-border); border-radius: 999px; padding: 0.3rem 0.8rem; font: inherit; cursor: pointer; }
  `,
})
export class AdminAppointmentsPage {
  protected readonly i18n = inject(I18nService);
  private readonly api = inject(AdminAppointmentApiService);

  protected readonly scope = signal<AppointmentScope>('upcoming');
  protected readonly appointments = signal<AdminAppointment[]>([]);

  constructor() {
    void this.reload();
  }

  protected setScope(scope: AppointmentScope): void {
    if (this.scope() === scope) {
      return;
    }
    this.scope.set(scope);
    void this.reload();
  }

  private async reload(): Promise<void> {
    this.appointments.set(await this.api.list(this.scope()));
  }

  protected format(iso: string): string {
    return formatInstant(iso, this.i18n.language());
  }

  protected async cancel(id: string): Promise<void> {
    await this.api.cancel(id);
    await this.reload();
  }
}
