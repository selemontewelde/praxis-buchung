import { Component, inject, signal } from '@angular/core';
import { PublicContentService } from '../core/content.service';
import { I18nService } from '../i18n/i18n.service';
import {
  type AdminTherapist,
  AdminTherapistApiService,
} from './admin-therapist-api.service';

@Component({
  selector: 'app-admin-therapists-page',
  templateUrl: './admin-therapists-page.html',
  styleUrl: './admin-therapists-page.css',
})
export class AdminTherapistsPage {
  protected readonly i18n = inject(I18nService);
  protected readonly content = inject(PublicContentService);
  private readonly api = inject(AdminTherapistApiService);

  protected readonly therapists = signal<AdminTherapist[]>([]);

  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly titleField = signal('');
  protected readonly roleDe = signal('');
  protected readonly roleEn = signal('');
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
    this.therapists.set(await this.api.list());
  }

  protected async create(): Promise<void> {
    if (this.firstName().trim() === '' || this.lastName().trim() === '') {
      return;
    }
    await this.api.create({
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      title: this.titleField().trim() || undefined,
      roleDe: this.roleDe().trim(),
      roleEn: this.roleEn().trim(),
      photoUrl: this.photoUrl().trim() || undefined,
      activeFrom: this.activeFrom(),
      activeUntil: this.activeUntil() || undefined,
    });
    this.firstName.set('');
    this.lastName.set('');
    this.titleField.set('');
    this.roleDe.set('');
    this.roleEn.set('');
    this.photoUrl.set('');
    this.activeUntil.set('');
    await this.reload();
  }

  protected async deactivate(t: AdminTherapist): Promise<void> {
    await this.api.update(t.id, { activeUntil: new Date().toISOString() });
    await this.reload();
  }

  protected async reactivate(t: AdminTherapist): Promise<void> {
    await this.api.update(t.id, { activeUntil: null });
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
