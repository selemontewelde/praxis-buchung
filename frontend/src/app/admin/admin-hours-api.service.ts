import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface HoursWindow {
  weekday: string;
  startMin: number;
  endMin: number;
}

/** Client for the admin opening-hours and per-therapist working-hours endpoints. */
@Injectable({ providedIn: 'root' })
export class AdminHoursApiService {
  private readonly http = inject(HttpClient);

  getOpening(): Promise<HoursWindow[]> {
    return firstValueFrom(this.http.get<HoursWindow[]>('/api/admin/opening-hours'));
  }

  setOpening(windows: HoursWindow[]): Promise<{ ok: true }> {
    return firstValueFrom(
      this.http.put<{ ok: true }>('/api/admin/opening-hours', { windows }),
    );
  }

  getWorking(therapistId: string): Promise<HoursWindow[]> {
    return firstValueFrom(
      this.http.get<HoursWindow[]>(
        `/api/admin/therapists/${therapistId}/working-hours`,
      ),
    );
  }

  setWorking(therapistId: string, windows: HoursWindow[]): Promise<{ ok: true }> {
    return firstValueFrom(
      this.http.put<{ ok: true }>(
        `/api/admin/therapists/${therapistId}/working-hours`,
        { windows },
      ),
    );
  }
}
