import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AdminAppointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  serviceName: string;
  therapistId: string;
  therapistName: string;
  startAt: string;
  endAt: string;
  status: 'BOOKED' | 'CANCELLED';
}

export type AppointmentScope = 'upcoming' | 'past';

/** Client for the authenticated /api/admin/appointments endpoints. */
@Injectable({ providedIn: 'root' })
export class AdminAppointmentApiService {
  private readonly http = inject(HttpClient);

  list(
    when: AppointmentScope,
    therapistId?: string,
  ): Promise<AdminAppointment[]> {
    let url = `/api/admin/appointments?when=${when}`;
    if (therapistId !== undefined && therapistId !== '') {
      url += `&therapistId=${encodeURIComponent(therapistId)}`;
    }
    return firstValueFrom(this.http.get<AdminAppointment[]>(url));
  }

  cancel(id: string): Promise<{ status: 'CANCELLED' }> {
    return firstValueFrom(
      this.http.post<{ status: 'CANCELLED' }>(
        `/api/admin/appointments/${id}/cancel`,
        {},
      ),
    );
  }
}
