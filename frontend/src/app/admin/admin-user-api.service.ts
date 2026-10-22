import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { AdminRole } from './admin-auth.service';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  therapistId: string | null;
  therapistName: string | null;
}

export interface CreateAdminUserPayload {
  email: string;
  password: string;
  role: AdminRole;
  therapistId?: string;
}

export interface UpdateAdminUserPayload {
  email?: string;
  role?: AdminRole;
  therapistId?: string | null;
}

/** Client for the ADMIN-only /api/admin/users endpoints. */
@Injectable({ providedIn: 'root' })
export class AdminUserApiService {
  private readonly http = inject(HttpClient);

  list(): Promise<AdminUser[]> {
    return firstValueFrom(this.http.get<AdminUser[]>('/api/admin/users'));
  }

  create(payload: CreateAdminUserPayload): Promise<{ id: string }> {
    return firstValueFrom(this.http.post<{ id: string }>('/api/admin/users', payload));
  }

  update(id: string, patch: UpdateAdminUserPayload): Promise<{ ok: true }> {
    return firstValueFrom(this.http.patch<{ ok: true }>(`/api/admin/users/${id}`, patch));
  }

  remove(id: string): Promise<{ ok: true }> {
    return firstValueFrom(this.http.delete<{ ok: true }>(`/api/admin/users/${id}`));
  }

  resetPassword(id: string, newPassword: string): Promise<{ ok: true }> {
    return firstValueFrom(
      this.http.post<{ ok: true }>(`/api/admin/users/${id}/password`, {
        newPassword,
      }),
    );
  }
}
