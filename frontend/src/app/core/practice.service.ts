import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** The public practice data served by GET /api/public/practice (presentation only). */
export interface PublicPractice {
  branding: {
    name: string;
    tagline?: string;
    logoPath: string;
    colors: { primary: string; accent: string };
  };
  contact: {
    street: string;
    postalCode: string;
    city: string;
    phone: string;
    email: string;
  };
  legal: {
    owner: string;
    privacyPolicyVersion: string;
  };
}

/**
 * Loads the practice's presentation data from the backend and exposes it as
 * signals. Branding colours are applied to the document as CSS custom properties,
 * so the whole site themes itself from the config without a rebuild.
 *
 * `load()` runs once at startup (app initializer). It never throws: if the backend
 * is unreachable the site still renders with its default theme.
 */
@Injectable({ providedIn: 'root' })
export class PracticeService {
  private readonly http = inject(HttpClient);

  private readonly _practice = signal<PublicPractice | null>(null);
  readonly practice = this._practice.asReadonly();
  readonly branding = computed(() => this._practice()?.branding ?? null);
  readonly contact = computed(() => this._practice()?.contact ?? null);
  readonly legal = computed(() => this._practice()?.legal ?? null);

  async load(): Promise<void> {
    try {
      const practice = await firstValueFrom(
        this.http.get<PublicPractice>('/api/public/practice'),
      );
      this._practice.set(practice);
      this.applyBranding(practice);
    } catch {
      // Keep the default theme; a later retry or page reload can recover.
    }
  }

  private applyBranding(practice: PublicPractice): void {
    try {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', practice.branding.colors.primary);
      root.style.setProperty('--color-accent', practice.branding.colors.accent);
    } catch {
      // No document in this environment; nothing to theme.
    }
  }
}
