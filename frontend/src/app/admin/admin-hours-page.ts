import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { AdminAuthService } from './admin-auth.service';
import {
  AdminHoursApiService,
  type HoursWindow,
} from './admin-hours-api.service';
import { AdminTherapistApiService } from './admin-therapist-api.service';

const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

@Component({
  selector: 'app-admin-hours-page',
  templateUrl: './admin-hours-page.html',
  styleUrl: './admin-hours-page.css',
})
export class AdminHoursPage {
  protected readonly i18n = inject(I18nService);
  private readonly api = inject(AdminHoursApiService);
  private readonly therapistApi = inject(AdminTherapistApiService);
  private readonly auth = inject(AdminAuthService);

  // Only an ADMIN edits practice opening hours and picks a therapist; a THERAPIST
  // edits just their own working hours.
  protected readonly isAdmin = computed(
    () => this.auth.admin()?.role === 'ADMIN',
  );

  protected readonly weekdays = WEEKDAYS;
  protected readonly therapists = signal<{ id: string; name: string }[]>([]);
  protected readonly selectedTherapist = signal('');

  protected readonly opening = signal<HoursWindow[]>([]);
  protected readonly working = signal<HoursWindow[]>([]);
  protected readonly openingStatus = signal<string | null>(null);
  protected readonly workingStatus = signal<string | null>(null);

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    const identity = this.auth.admin();
    if (identity?.role === 'ADMIN') {
      this.opening.set(await this.api.getOpening());
      const list = await this.therapistApi.list();
      this.therapists.set(
        list.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` })),
      );
    } else if (identity !== null && identity.therapistId !== null) {
      // THERAPIST: edit only their own working hours — no practice opening hours,
      // no therapist list (that endpoint is ADMIN-only).
      this.selectedTherapist.set(identity.therapistId);
      this.working.set(await this.api.getWorking(identity.therapistId));
    }
  }

  protected toTime(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  protected async selectTherapist(event: Event): Promise<void> {
    const id = (event.target as HTMLSelectElement).value;
    this.selectedTherapist.set(id);
    this.workingStatus.set(null);
    this.working.set(id === '' ? [] : await this.api.getWorking(id));
  }

  // --- window-array editing (shared by opening + working) ---
  protected addWindow(target: 'opening' | 'working'): void {
    const sig = target === 'opening' ? this.opening : this.working;
    sig.update((ws) => [
      ...ws,
      { weekday: 'MONDAY', startMin: 480, endMin: 720 },
    ]);
  }

  protected removeWindow(target: 'opening' | 'working', index: number): void {
    const sig = target === 'opening' ? this.opening : this.working;
    sig.update((ws) => ws.filter((_, i) => i !== index));
  }

  protected setWeekday(
    target: 'opening' | 'working',
    index: number,
    event: Event,
  ): void {
    const weekday = (event.target as HTMLSelectElement).value;
    this.patch(target, index, { weekday });
  }

  protected setTime(
    target: 'opening' | 'working',
    index: number,
    field: 'startMin' | 'endMin',
    event: Event,
  ): void {
    const value = this.toMinutes((event.target as HTMLInputElement).value);
    this.patch(target, index, { [field]: value });
  }

  private patch(
    target: 'opening' | 'working',
    index: number,
    patch: Partial<HoursWindow>,
  ): void {
    const sig = target === 'opening' ? this.opening : this.working;
    sig.update((ws) => ws.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  }

  protected async saveOpening(): Promise<void> {
    try {
      await this.api.setOpening(this.opening());
      this.openingStatus.set(this.i18n.t('adminHours.saved'));
    } catch {
      this.openingStatus.set(this.i18n.t('adminHours.error'));
    }
  }

  protected async saveWorking(): Promise<void> {
    if (this.selectedTherapist() === '') {
      return;
    }
    try {
      await this.api.setWorking(this.selectedTherapist(), this.working());
      this.workingStatus.set(this.i18n.t('adminHours.saved'));
    } catch {
      this.workingStatus.set(this.i18n.t('adminHours.error'));
    }
  }
}
