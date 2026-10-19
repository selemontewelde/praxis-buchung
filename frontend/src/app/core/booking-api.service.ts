import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface SlotsByTherapist {
  therapistId: string;
  firstName: string;
  lastName: string;
  /** Slot start instants as UTC ISO strings. */
  slots: string[];
}

export interface BookingPayload {
  serviceId: string;
  therapistId: string;
  startAt: string;
  patient: { name: string; email: string; phone: string };
  consent: { policyVersion: string; accepted: true };
}

export interface BookingConfirmation {
  id: string;
  startAt: string;
  endAt: string;
  status: 'BOOKED';
}

/** Thin client for the availability and booking endpoints. */
@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly http = inject(HttpClient);

  getSlots(params: {
    serviceId: string;
    therapistId?: string;
    from: string;
    to: string;
  }): Promise<SlotsByTherapist[]> {
    let query = new HttpParams()
      .set('serviceId', params.serviceId)
      .set('from', params.from)
      .set('to', params.to);
    if (params.therapistId) {
      query = query.set('therapistId', params.therapistId);
    }
    return firstValueFrom(
      this.http.get<SlotsByTherapist[]>('/api/public/slots', { params: query }),
    );
  }

  createBooking(payload: BookingPayload): Promise<BookingConfirmation> {
    return firstValueFrom(
      this.http.post<BookingConfirmation>('/api/public/bookings', payload),
    );
  }
}
