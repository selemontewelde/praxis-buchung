import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AdminIdentity {
  email: string;
}

/**
 * Admin session state on the client. The session itself is an HTTP-only cookie
 * the browser sends automatically (same origin via the dev proxy / reverse
 * proxy), so this service only tracks who is logged in.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly _admin = signal<AdminIdentity | null>(null);
  readonly admin = this._admin.asReadonly();
  private loaded = false;

  async login(email: string, password: string): Promise<void> {
    const identity = await firstValueFrom(
      this.http.post<AdminIdentity>('/api/admin/login', { email, password }),
    );
    this._admin.set(identity);
    this.loaded = true;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/admin/logout', {}));
    } finally {
      this._admin.set(null);
      this.loaded = true;
    }
  }

  /** Resolve the current admin, querying /me once and caching the result. */
  async ensureLoaded(): Promise<AdminIdentity | null> {
    if (!this.loaded) {
      try {
        this._admin.set(
          await firstValueFrom(this.http.get<AdminIdentity>('/api/admin/me')),
        );
      } catch {
        this._admin.set(null);
      }
      this.loaded = true;
    }
    return this._admin();
  }
}
