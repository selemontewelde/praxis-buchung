import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import {
  type AdminBlock,
  AdminBlocksApiService,
} from './admin-blocks-api.service';
import { AdminTherapistApiService } from './admin-therapist-api.service';

const REASONS = ['VACATION', 'TRAINING', 'SICK', 'OTHER'];

@Component({
  selector: 'app-admin-blocks-page',
  template: `
    <h1>{{ i18n.t('adminBlocks.title') }}</h1>

    <form class="add" (submit)="$event.preventDefault(); create()">
      <label>
        <span>{{ i18n.t('adminBlocks.therapist') }}</span>
        <select [value]="therapistId()" (change)="therapistId.set($any($event.target).value)">
          <option value="">—</option>
          @for (t of therapists(); track t.id) {
            <option [value]="t.id">{{ t.name }}</option>
          }
        </select>
      </label>
      <label>
        <span>{{ i18n.t('adminBlocks.reason') }}</span>
        <select [value]="reason()" (change)="reason.set($any($event.target).value)">
          @for (r of reasons; track r) {
            <option [value]="r">{{ i18n.t($any('blockReason.' + r)) }}</option>
          }
        </select>
      </label>
      <label>
        <span>{{ i18n.t('adminBlocks.from') }}</span>
        <input type="datetime-local" [value]="start()" (input)="start.set($any($event.target).value)" />
      </label>
      <label>
        <span>{{ i18n.t('adminBlocks.to') }}</span>
        <input type="datetime-local" [value]="end()" (input)="end.set($any($event.target).value)" />
      </label>
      <label>
        <span>{{ i18n.t('adminBlocks.note') }}</span>
        <input [value]="note()" (input)="note.set($any($event.target).value)" />
      </label>
      <button type="submit" [disabled]="therapistId() === '' || start() === '' || end() === ''">
        {{ i18n.t('adminBlocks.add') }}
      </button>
    </form>

    @if (blocks().length === 0) {
      <p>{{ i18n.t('adminBlocks.none') }}</p>
    } @else {
      <ul class="block-list">
        @for (b of blocks(); track b.id) {
          <li>
            <strong>{{ b.therapistName }}</strong>
            · {{ i18n.t($any('blockReason.' + b.reason)) }}
            · {{ format(b.startAt) }} – {{ format(b.endAt) }}
            @if (b.note) { · {{ b.note }} }
            <button type="button" (click)="remove(b.id)">{{ i18n.t('adminBlocks.delete') }}</button>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .add { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; margin: 1rem 0 1.5rem; }
    label { display: flex; flex-direction: column; gap: 0.25rem; }
    select, input { padding: 0.35rem 0.5rem; border: 1px solid var(--color-border); border-radius: 6px; font: inherit; }
    button { background: var(--color-primary); color: #fff; border: 0; border-radius: 999px; padding: 0.35rem 0.9rem; font: inherit; cursor: pointer; }
    button[disabled] { opacity: 0.5; cursor: not-allowed; }
    .block-list { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
    .block-list li { border: 1px solid var(--color-border); border-radius: 8px; padding: 0.5rem 0.75rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .block-list button { margin-left: auto; background: transparent; color: #b91c1c; border: 1px solid var(--color-border); }
  `,
})
export class AdminBlocksPage {
  protected readonly i18n = inject(I18nService);
  private readonly api = inject(AdminBlocksApiService);
  private readonly therapistApi = inject(AdminTherapistApiService);

  protected readonly reasons = REASONS;
  protected readonly blocks = signal<AdminBlock[]>([]);
  protected readonly therapists = signal<{ id: string; name: string }[]>([]);

  protected readonly therapistId = signal('');
  protected readonly reason = signal('VACATION');
  protected readonly start = signal('');
  protected readonly end = signal('');
  protected readonly note = signal('');

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    const list = await this.therapistApi.list();
    this.therapists.set(
      list.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` })),
    );
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.blocks.set(await this.api.list());
  }

  protected format(iso: string): string {
    return new Intl.DateTimeFormat(
      this.i18n.language() === 'de' ? 'de-CH' : 'en-GB',
      { dateStyle: 'medium', timeStyle: 'short' },
    ).format(new Date(iso));
  }

  protected async create(): Promise<void> {
    if (this.therapistId() === '' || this.start() === '' || this.end() === '') {
      return;
    }
    await this.api.create({
      therapistId: this.therapistId(),
      reason: this.reason(),
      startAt: new Date(this.start()).toISOString(),
      endAt: new Date(this.end()).toISOString(),
      note: this.note().trim() || undefined,
    });
    this.start.set('');
    this.end.set('');
    this.note.set('');
    await this.reload();
  }

  protected async remove(id: string): Promise<void> {
    await this.api.remove(id);
    await this.reload();
  }
}
