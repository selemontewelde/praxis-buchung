import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { LocalizedText } from '../i18n/translations';

export interface AdminService {
  id: string;
  name: string;
  durationMin: number;
  description: LocalizedText | null;
  active: boolean;
}

export interface CreateServicePayload {
  name: string;
  durationMin: number;
  description?: LocalizedText;
}

export type UpdateServicePayload = Partial<
  Omit<AdminService, 'id'> & { description: LocalizedText }
>;

/** Client for the authenticated /api/admin/services endpoints. */
@Injectable({ providedIn: 'root' })
export class AdminServiceApiService {
  private readonly http = inject(HttpClient);

  list(): Promise<AdminService[]> {
    return firstValueFrom(this.http.get<AdminService[]>('/api/admin/services'));
  }

  create(payload: CreateServicePayload): Promise<{ id: string }> {
    return firstValueFrom(
      this.http.post<{ id: string }>('/api/admin/services', payload),
    );
  }

  update(id: string, patch: UpdateServicePayload): Promise<{ ok: true }> {
    return firstValueFrom(
      this.http.patch<{ ok: true }>(`/api/admin/services/${id}`, patch),
    );
  }
}
