import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import type { Language, LocalizedText } from '../i18n/translations';
import {
  type AdminService,
  AdminServiceApiService,
} from './admin-service-api.service';

@Component({
  selector: 'app-admin-services-page',
  template: `
    <h1>{{ i18n.t('adminServices.title') }}</h1>

    <form class="add" (submit)="$event.preventDefault(); create()">
      <label>
        <span>{{ i18n.t('adminServices.name') }}</span>
        <input [value]="newName()" (input)="newName.set($any($event.target).value)" />
      </label>
      <label>
        <span>{{ i18n.t('adminServices.duration') }}</span>
        <input type="number" min="1" [value]="newDuration()" (input)="newDuration.set($any($event.target).value)" />
      </label>
      @for (lang of i18n.languages; track lang) {
        <label>
          <span>{{ i18n.t('adminServices.description') }} ({{ i18n.languageLabel(lang) }})</span>
          <input [value]="newDesc()[lang] ?? ''" (input)="setNewDesc(lang, $any($event.target).value)" />
        </label>
      }
      <button type="submit" [disabled]="newName().trim() === '' || +newDuration() < 1">
        {{ i18n.t('adminServices.add') }}
      </button>
    </form>

    @if (status()) {
      <p class="status" role="status">{{ i18n.t($any(status())) }}</p>
    }

    @if (services().length === 0) {
      <p>{{ i18n.t('adminServices.none') }}</p>
    } @else {
      <ul class="service-list">
        @for (s of services(); track s.id) {
          <li [class.archived]="!s.active">
            <input
              [value]="s.name"
              (input)="patch(s.id, { name: $any($event.target).value })"
            />
            <input
              type="number"
              min="1"
              [value]="s.durationMin"
              (input)="patch(s.id, { durationMin: +$any($event.target).value })"
            />
            @for (lang of i18n.languages; track lang) {
              <input
                [value]="s.description?.[lang] ?? ''"
                [placeholder]="i18n.t('adminServices.description') + ' (' + i18n.languageLabel(lang) + ')'"
                (input)="patchDesc(s.id, lang, $any($event.target).value)"
              />
            }
            @if (!s.active) {
              <span class="badge">{{ i18n.t('adminServices.archived') }}</span>
            }
            <button type="button" (click)="save(s)">{{ i18n.t('adminServices.save') }}</button>
            <button type="button" class="toggle" (click)="toggleActive(s)">
              {{ i18n.t(s.active ? 'adminServices.archive' : 'adminServices.reactivate') }}
            </button>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .add { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; margin: 1rem 0 1.5rem; }
    label { display: flex; flex-direction: column; gap: 0.25rem; }
    input { padding: 0.35rem 0.5rem; border: 1px solid var(--color-border); border-radius: 6px; font: inherit; }
    button { background: var(--color-primary); color: #fff; border: 0; border-radius: 999px; padding: 0.35rem 0.9rem; font: inherit; cursor: pointer; }
    button[disabled] { opacity: 0.5; cursor: not-allowed; }
    .status { color: var(--color-primary); }
    .service-list { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
    .service-list li { border: 1px solid var(--color-border); border-radius: 8px; padding: 0.5rem 0.75rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .service-list li.archived { opacity: 0.6; }
    .badge { font-size: 0.8rem; color: #b45309; }
    .service-list .toggle { margin-left: auto; background: transparent; color: var(--color-primary); border: 1px solid var(--color-border); }
  `,
})
export class AdminServicesPage {
  protected readonly i18n = inject(I18nService);
  private readonly api = inject(AdminServiceApiService);

  protected readonly services = signal<AdminService[]>([]);
  protected readonly status = signal<string | null>(null);

  protected readonly newName = signal('');
  protected readonly newDuration = signal('30');
  protected readonly newDesc = signal<LocalizedText>({});

  constructor() {
    void this.reload();
  }

  private async reload(): Promise<void> {
    this.services.set(await this.api.list());
  }

  protected patch(id: string, change: Partial<AdminService>): void {
    this.services.update((list) =>
      list.map((s) => (s.id === id ? { ...s, ...change } : s)),
    );
  }

  protected setNewDesc(lang: Language, value: string): void {
    this.newDesc.update((map) => ({ ...map, [lang]: value }));
  }

  /** Update one locale of a service's description map in place. */
  protected patchDesc(id: string, lang: Language, value: string): void {
    this.patch(id, {
      description: {
        ...this.services().find((s) => s.id === id)?.description,
        [lang]: value,
      },
    });
  }

  // Trim and drop empty locales. The backend requires de + en, so a description
  // is only sent when both are present; a partial edit is left unchanged rather
  // than sent. Clearing an existing description back to none is not offered here.
  private cleanDesc(map: LocalizedText | null): LocalizedText | undefined {
    const cleaned: LocalizedText = {};
    for (const lang of this.i18n.languages) {
      const value = map?.[lang]?.trim();
      if (value) {
        cleaned[lang] = value;
      }
    }
    return cleaned.de && cleaned.en ? cleaned : undefined;
  }

  protected async create(): Promise<void> {
    if (this.newName().trim() === '' || +this.newDuration() < 1) {
      return;
    }
    try {
      await this.api.create({
        name: this.newName().trim(),
        durationMin: +this.newDuration(),
        description: this.cleanDesc(this.newDesc()),
      });
      this.newName.set('');
      this.newDuration.set('30');
      this.newDesc.set({});
      this.status.set('adminServices.saved');
      await this.reload();
    } catch {
      this.status.set('adminServices.error');
    }
  }

  protected async save(s: AdminService): Promise<void> {
    try {
      await this.api.update(s.id, {
        name: s.name,
        durationMin: s.durationMin,
        description: this.cleanDesc(s.description),
      });
      this.status.set('adminServices.saved');
    } catch {
      this.status.set('adminServices.error');
    }
  }

  protected async toggleActive(s: AdminService): Promise<void> {
    try {
      await this.api.update(s.id, { active: !s.active });
      this.status.set('adminServices.saved');
      await this.reload();
    } catch {
      this.status.set('adminServices.error');
    }
  }
}
