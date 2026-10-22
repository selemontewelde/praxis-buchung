import { Component, inject, signal } from '@angular/core';
import { PublicContentService } from '../core/content.service';
import { I18nService } from '../i18n/i18n.service';
import type { Language, LocalizedText } from '../i18n/translations';
import {
  type AdminAppointment,
  AdminAppointmentApiService,
} from './admin-appointment-api.service';
import {
  type AdminTherapist,
  AdminTherapistApiService,
} from './admin-therapist-api.service';
import { formatInstant } from './format-instant';

@Component({
  selector: 'app-admin-therapists-page',
  templateUrl: './admin-therapists-page.html',
  styleUrl: './admin-therapists-page.css',
})
export class AdminTherapistsPage {
  protected readonly i18n = inject(I18nService);
  protected readonly content = inject(PublicContentService);
  private readonly api = inject(AdminTherapistApiService);
  private readonly appointmentApi = inject(AdminAppointmentApiService);

  protected readonly therapists = signal<AdminTherapist[]>([]);
  /** Open future appointments surfaced after a therapist is deactivated, by therapist id. */
  protected readonly openAppointments = signal<Record<string, AdminAppointment[]>>({});

  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly titleField = signal('');
  protected readonly role = signal<LocalizedText>({});
  protected readonly photoUrl = signal('');
  protected readonly activeFrom = signal(new Date().toISOString().slice(0, 10));
  protected readonly activeUntil = signal('');

  constructor() {
    void this.content.loadServices();
    void this.reload();
  }

  protected set(ref: { set: (v: string) => void }, event: Event): void {
    ref.set((event.target as HTMLInputElement).value);
  }

  protected setRole(lang: Language, value: string): void {
    this.role.update((map) => ({ ...map, [lang]: value }));
  }

  /** Trimmed role map with empty locales dropped (de + en required by the API). */
  private cleanRole(): LocalizedText {
    const cleaned: LocalizedText = {};
    for (const lang of this.i18n.languages) {
      const value = this.role()[lang]?.trim();
      if (value) {
        cleaned[lang] = value;
      }
    }
    return cleaned;
  }

  protected isActive(t: AdminTherapist): boolean {
    const now = new Date();
    return (
      new Date(t.activeFrom) <= now &&
      (t.activeUntil === null || new Date(t.activeUntil) > now)
    );
  }

  protected hasCapability(t: AdminTherapist, serviceId: string): boolean {
    return t.capabilityServiceIds.includes(serviceId);
  }

  private async reload(): Promise<void> {
    const list = await this.api.list();
    this.therapists.set(list);
    // Re-surface open future appointments for therapists that are already
    // inactive, so the state survives a page reload (not only the deactivate
    // click). Active therapists need no surfacing.
    await Promise.all(
      list
        .filter((t) => !this.isActive(t))
        .map((t) => this.loadOpenAppointments(t.id)),
    );
  }

  protected async create(): Promise<void> {
    if (this.firstName().trim() === '' || this.lastName().trim() === '') {
      return;
    }
    await this.api.create({
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      title: this.titleField().trim() || undefined,
      role: this.cleanRole(),
      photoUrl: this.photoUrl().trim() || undefined,
      activeFrom: this.activeFrom(),
      activeUntil: this.activeUntil() || undefined,
    });
    this.firstName.set('');
    this.lastName.set('');
    this.titleField.set('');
    this.role.set({});
    this.photoUrl.set('');
    this.activeUntil.set('');
    await this.reload();
  }

  protected async deactivate(t: AdminTherapist): Promise<void> {
    await this.api.update(t.id, { activeUntil: new Date().toISOString() });
    await this.reload();
    // Surface the therapist's open future appointments so reception can cancel them.
    await this.loadOpenAppointments(t.id);
  }

  private async loadOpenAppointments(therapistId: string): Promise<void> {
    const open = (await this.appointmentApi.list('upcoming', therapistId)).filter(
      (a) => a.status === 'BOOKED',
    );
    this.openAppointments.update((map) => ({ ...map, [therapistId]: open }));
  }

  protected async cancelAppointment(
    therapistId: string,
    appointmentId: string,
  ): Promise<void> {
    await this.appointmentApi.cancel(appointmentId);
    await this.loadOpenAppointments(therapistId);
  }

  protected formatInstant(iso: string): string {
    return formatInstant(iso, this.i18n.language());
  }

  protected async reactivate(t: AdminTherapist): Promise<void> {
    await this.api.update(t.id, { activeUntil: null });
    // Clear the (now irrelevant) open-appointments panel for this therapist.
    this.openAppointments.update((map) => {
      const next = { ...map };
      delete next[t.id];
      return next;
    });
    await this.reload();
  }

  protected async toggleCapability(
    t: AdminTherapist,
    serviceId: string,
    checked: boolean,
  ): Promise<void> {
    const ids = new Set(t.capabilityServiceIds);
    if (checked) {
      ids.add(serviceId);
    } else {
      ids.delete(serviceId);
    }
    await this.api.setCapabilities(t.id, [...ids]);
    await this.reload();
  }
}
