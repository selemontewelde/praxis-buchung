import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** A bookable service as served by GET /api/public/services. */
export interface PublicService {
  id: string;
  name: string;
  durationMin: number;
  descriptionDe: string | null;
  descriptionEn: string | null;
}

/** An active team member as served by GET /api/public/team. */
export interface PublicTeamMember {
  firstName: string;
  lastName: string;
  title: string | null;
  roleDe: string | null;
  roleEn: string | null;
  photoUrl: string | null;
}

/**
 * Loads the public operational content (services, team) from the backend and
 * exposes it as signals. Each list is fetched at most once; a failed fetch leaves
 * the list empty so pages still render. Both language variants are kept so the
 * language switch needs no refetch — the page picks the field.
 */
@Injectable({ providedIn: 'root' })
export class PublicContentService {
  private readonly http = inject(HttpClient);

  private readonly _services = signal<PublicService[]>([]);
  private readonly _team = signal<PublicTeamMember[]>([]);
  readonly services = this._services.asReadonly();
  readonly team = this._team.asReadonly();

  private servicesLoaded = false;
  private teamLoaded = false;

  async loadServices(): Promise<void> {
    if (this.servicesLoaded) {
      return;
    }
    try {
      this._services.set(
        await firstValueFrom(
          this.http.get<PublicService[]>('/api/public/services'),
        ),
      );
      this.servicesLoaded = true;
    } catch {
      // Leave the list empty; a later page visit retries.
    }
  }

  async loadTeam(): Promise<void> {
    if (this.teamLoaded) {
      return;
    }
    try {
      this._team.set(
        await firstValueFrom(
          this.http.get<PublicTeamMember[]>('/api/public/team'),
        ),
      );
      this.teamLoaded = true;
    } catch {
      // Leave the list empty.
    }
  }
}
