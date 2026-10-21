import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BookingApiService,
  type BookingConfirmation,
} from '../core/booking-api.service';
import { PracticeService } from '../core/practice.service';
import { PublicContentService } from '../core/content.service';
import { I18nService } from '../i18n/i18n.service';

interface SlotOption {
  startAt: string;
  therapistId: string;
  therapistName: string;
  label: string;
}

@Component({
  selector: 'app-booking-page',
  imports: [RouterLink],
  templateUrl: './booking-page.html',
  styleUrl: './booking-page.css',
})
export class BookingPage {
  protected readonly i18n = inject(I18nService);
  protected readonly content = inject(PublicContentService);
  protected readonly practice = inject(PracticeService);
  private readonly api = inject(BookingApiService);

  protected readonly serviceId = signal('');
  protected readonly therapistId = signal('');
  protected readonly date = signal(this.today());

  protected readonly slotOptions = signal<SlotOption[]>([]);
  protected readonly loadingSlots = signal(false);
  protected readonly selected = signal<SlotOption | null>(null);

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly phone = signal('');
  protected readonly consent = signal(false);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmation = signal<BookingConfirmation | null>(null);

  protected readonly canSubmit = computed(
    () =>
      this.selected() !== null &&
      this.name().trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()) &&
      this.phone().trim() !== '' &&
      this.consent() &&
      !this.submitting(),
  );

  constructor() {
    void this.content.loadServices();
    void this.content.loadTeam();
  }

  protected set(signalRef: { set: (v: string) => void }, event: Event): void {
    signalRef.set((event.target as HTMLInputElement | HTMLSelectElement).value);
  }

  protected async loadSlots(): Promise<void> {
    if (this.serviceId() === '' || this.date() === '') {
      return;
    }
    this.loadingSlots.set(true);
    this.error.set(null);
    this.selected.set(null);
    try {
      const byTherapist = await this.api.getSlots({
        serviceId: this.serviceId(),
        therapistId: this.therapistId() || undefined,
        from: this.date(),
        to: this.date(),
      });
      const options: SlotOption[] = [];
      for (const t of byTherapist) {
        for (const startAt of t.slots) {
          options.push({
            startAt,
            therapistId: t.therapistId,
            therapistName: `${t.firstName} ${t.lastName}`,
            label: this.formatTime(startAt),
          });
        }
      }
      options.sort((a, b) => a.startAt.localeCompare(b.startAt));
      this.slotOptions.set(options);
    } catch (error) {
      // Distinguish a real failure from an empty day: show the error rather than
      // the reassuring "no times available" message.
      this.slotOptions.set([]);
      this.error.set(this.messageFrom(error));
    } finally {
      this.loadingSlots.set(false);
    }
  }

  protected async submit(): Promise<void> {
    const slot = this.selected();
    if (slot === null || !this.canSubmit()) {
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    try {
      const confirmation = await this.api.createBooking({
        serviceId: this.serviceId(),
        therapistId: slot.therapistId,
        startAt: slot.startAt,
        patient: {
          name: this.name().trim(),
          email: this.email().trim(),
          phone: this.phone().trim(),
        },
        consent: {
          policyVersion: this.practice.legal()?.privacyPolicyVersion ?? 'unknown',
          accepted: true,
        },
      });
      this.confirmation.set(confirmation);
    } catch (error) {
      const message = this.messageFrom(error);
      // A 409 means the slot was taken in the meantime — refresh the list so the
      // now-dead slot disappears and the patient picks another. loadSlots clears
      // the error, so set the message afterwards.
      if (error instanceof HttpErrorResponse && error.status === 409) {
        await this.loadSlots();
      }
      this.error.set(message);
    } finally {
      this.submitting.set(false);
    }
  }

  protected bookAnother(): void {
    this.confirmation.set(null);
    this.selected.set(null);
    this.slotOptions.set([]);
    this.name.set('');
    this.email.set('');
    this.phone.set('');
    this.consent.set(false);
    this.error.set(null);
  }

  protected formatTime(iso: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      timeZone: this.practice.timezone(),
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  protected formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      timeZone: this.practice.timezone(),
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(iso));
  }

  private locale(): string {
    return this.i18n.locale();
  }

  private today(): string {
    // Default the date input to "today" in the practice timezone, matching how
    // slots are queried and displayed (avoids an off-by-one across zones).
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.practice.timezone(),
    }).format(new Date());
  }

  // Map errors to translated, user-facing text — never echo raw backend messages
  // (they are English and bypass our DE/EN table).
  private messageFrom(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return this.i18n.t('booking.slotUnavailable');
    }
    return this.i18n.t('booking.failed');
  }
}
