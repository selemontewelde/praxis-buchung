import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { LocalizedText } from '../i18n/translations';

export interface AdminTherapist {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  role: LocalizedText | null;
  photoUrl: string | null;
  activeFrom: string;
  activeUntil: string | null;
  capabilityServiceIds: string[];
}

export interface CreateTherapistPayload {
  firstName: string;
  lastName: string;
  title?: string;
  role: LocalizedText;
  photoUrl?: string;
  activeFrom: string;
  activeUntil?: string;
}

/** Client for the authenticated /api/admin/therapists endpoints. */
@Injectable({ providedIn: 'root' })
export class AdminTherapistApiService {
  private readonly http = inject(HttpClient);

  list(): Promise<AdminTherapist[]> {
    return firstValueFrom(
      this.http.get<AdminTherapist[]>('/api/admin/therapists'),
    );
  }

  create(payload: CreateTherapistPayload): Promise<{ id: string }> {
    return firstValueFrom(
      this.http.post<{ id: string }>('/api/admin/therapists', payload),
    );
  }

  update(
    id: string,
    patch: { activeUntil?: string | null },
  ): Promise<{ ok: true }> {
    return firstValueFrom(
      this.http.patch<{ ok: true }>(`/api/admin/therapists/${id}`, patch),
    );
  }

  setCapabilities(id: string, serviceIds: string[]): Promise<{ ok: true }> {
    return firstValueFrom(
      this.http.put<{ ok: true }>(`/api/admin/therapists/${id}/capabilities`, {
        serviceIds,
      }),
    );
  }
}
