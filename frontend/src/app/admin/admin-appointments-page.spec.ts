import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminAppointmentsPage } from './admin-appointments-page';

describe('AdminAppointmentsPage', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [AdminAppointmentsPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('lists upcoming appointments with patient and therapist and a cancel button', async () => {
    const fixture = TestBed.createComponent(AdminAppointmentsPage);
    const httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne('/api/admin/appointments?when=upcoming').flush([
      {
        id: 'a1',
        patientName: 'Max Muster',
        patientEmail: 'max@example.com',
        patientPhone: '+41 79 000 00 00',
        serviceName: 'Massage',
        therapistId: 'anna',
        therapistName: 'Anna Keller',
        startAt: '2026-07-01T08:00:00.000Z',
        endAt: '2026-07-01T08:30:00.000Z',
        status: 'BOOKED',
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Max Muster');
    expect(el.textContent).toContain('Anna Keller');
    expect(el.querySelector('.appt-list button')?.textContent).toContain(
      'Stornieren',
    );
    httpMock.verify();
  });
});
