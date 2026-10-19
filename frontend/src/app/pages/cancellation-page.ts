import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  BookingApiService,
  type CancellationView,
} from '../core/booking-api.service';
import { PracticeService } from '../core/practice.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'app-cancellation-page',
  template: `
    <h1>{{ i18n.t('cancel.title') }}</h1>

    @if (cancelled()) {
      <p role="status">{{ i18n.t('cancel.done') }}</p>
    } @else if (loadFailed()) {
      <p role="alert">{{ i18n.t('cancel.notFound') }}</p>
    } @else if (view(); as v) {
      <p>{{ i18n.t('cancel.appointmentLabel') }}</p>
      <p class="appt">
        {{ v.serviceName }} · {{ v.therapistName }}<br />
        {{ formatDateTime(v.startAt) }}
      </p>

      @if (v.status === 'CANCELLED') {
        <p>{{ i18n.t('cancel.alreadyCancelled') }}</p>
      } @else if (v.cancellable) {
        @if (error(); as msg) {
          <p class="error" role="alert">{{ msg }}</p>
        }
        <button type="button" (click)="cancel()" [disabled]="cancelling()">
          {{ cancelling() ? i18n.t('cancel.cancelling') : i18n.t('cancel.confirm') }}
        </button>
      } @else {
        <p>{{ i18n.t('cancel.pleaseCall') }}</p>
        @if (practice.contact()?.phone; as phone) {
          <p><a [href]="'tel:' + phone">{{ phone }}</a></p>
        }
      }
    }
  `,
  styles: `
    .appt {
      font-weight: 600;
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
    button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
})
export class CancellationPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(BookingApiService);
  protected readonly i18n = inject(I18nService);
  protected readonly practice = inject(PracticeService);

  protected readonly view = signal<CancellationView | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly cancelled = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly token =
    this.route.snapshot.queryParamMap.get('token') ?? '';

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    if (this.token === '') {
      this.loadFailed.set(true);
      return;
    }
    try {
      this.view.set(await this.api.getCancellation(this.token));
    } catch {
      this.loadFailed.set(true);
    }
  }

  protected async cancel(): Promise<void> {
    this.cancelling.set(true);
    this.error.set(null);
    try {
      await this.api.cancelBooking(this.token);
      this.cancelled.set(true);
    } catch (error) {
      // 410 = the deadline passed in the meantime → reload to show "please call".
      if (error instanceof HttpErrorResponse && error.status === 410) {
        await this.load();
      } else {
        this.error.set(this.i18n.t('cancel.failed'));
      }
    } finally {
      this.cancelling.set(false);
    }
  }

  protected formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat(
      this.i18n.language() === 'de' ? 'de-CH' : 'en-GB',
      {
        timeZone: this.practice.timezone(),
        dateStyle: 'full',
        timeStyle: 'short',
      },
    ).format(new Date(iso));
  }
}
