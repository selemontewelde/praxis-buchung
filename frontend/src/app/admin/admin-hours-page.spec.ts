import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type AdminIdentity, AdminAuthService } from './admin-auth.service';
import { AdminHoursPage } from './admin-hours-page';

describe('AdminHoursPage', () => {
  const adminSig = signal<AdminIdentity | null>(null);

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    adminSig.set(null);
    TestBed.configureTestingModule({
      imports: [AdminHoursPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminAuthService, useValue: { admin: adminSig.asReadonly() } },
      ],
    });
  });

  it('loads opening hours + the therapist list for an ADMIN', async () => {
    adminSig.set({ email: 'a@b.c', role: 'ADMIN', therapistId: null });
    const fixture = TestBed.createComponent(AdminHoursPage);
    const httpMock = TestBed.inject(HttpTestingController);

    httpMock
      .expectOne('/api/admin/opening-hours')
      .flush([{ weekday: 'MONDAY', startMin: 480, endMin: 720 }]);
    await fixture.whenStable();
    httpMock.expectOne('/api/admin/therapists').flush([
      {
        id: 'anna',
        firstName: 'Anna',
        lastName: 'Keller',
        title: null,
        role: { de: 'r', en: 'r' },
        photoUrl: null,
        activeFrom: '2024-01-01T00:00:00.000Z',
        activeUntil: null,
        capabilityServiceIds: [],
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const start = el.querySelector<HTMLInputElement>('input[type="time"]');
    expect(start?.value).toBe('08:00');
    httpMock.verify();
  });

  it('loads only their own working hours for a THERAPIST (no opening, no list)', async () => {
    adminSig.set({ email: 'anna@b.c', role: 'THERAPIST', therapistId: 'anna' });
    const fixture = TestBed.createComponent(AdminHoursPage);
    const httpMock = TestBed.inject(HttpTestingController);

    httpMock
      .expectOne('/api/admin/therapists/anna/working-hours')
      .flush([{ weekday: 'TUESDAY', startMin: 540, endMin: 600 }]);
    await fixture.whenStable();
    fixture.detectChanges();

    // The ADMIN-only calls must NOT be made.
    httpMock.expectNone('/api/admin/opening-hours');
    httpMock.expectNone('/api/admin/therapists');
    const el = fixture.nativeElement as HTMLElement;
    const start = el.querySelector<HTMLInputElement>('input[type="time"]');
    expect(start?.value).toBe('09:00');
    httpMock.verify();
  });
});
