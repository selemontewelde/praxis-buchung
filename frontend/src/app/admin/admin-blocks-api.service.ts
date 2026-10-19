import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AdminBlock {
  id: string;
  therapistId: string;
  therapistName: string;
  reason: string;
  startAt: string;
  endAt: string;
  note: string | null;
}

export interface CreateBlockPayload {
  therapistId: string;
  reason: string;
  startAt: string;
  endAt: string;
  note?: string;
}

/** Client for the admin blocks (absences) endpoints. */
@Injectable({ providedIn: 'root' })
export class AdminBlocksApiService {
  private readonly http = inject(HttpClient);

  list(): Promise<AdminBlock[]> {
    return firstValueFrom(this.http.get<AdminBlock[]>('/api/admin/blocks'));
  }

  create(payload: CreateBlockPayload): Promise<{ id: string }> {
    return firstValueFrom(
      this.http.post<{ id: string }>('/api/admin/blocks', payload),
    );
  }

  remove(id: string): Promise<{ ok: true }> {
    return firstValueFrom(
      this.http.delete<{ ok: true }>(`/api/admin/blocks/${id}`),
    );
  }
}
