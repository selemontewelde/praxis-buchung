import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BookingPage } from './booking-page';

interface BookingPageInternals {
  selected: { set: (v: unknown) => void };
  name: { set: (v: string) => void };
  email: { set: (v: string) => void };
  phone: { set: (v: string) => void };
  consent: { set: (v: boolean) => void };
  submit: () => Promise<void>;
}

async function setupComponent() {
  const fixture = TestBed.createComponent(BookingPage);
  const httpMock = TestBed.inject(HttpTestingController);
  // The constructor loads services and team.
  httpMock.expectOne('/api/public/services').flush([
    {
      id: 'physio',
      name: 'Physiotherapie',
      durationMin: 30,
      descriptionDe: null,
      descriptionEn: null,
    },
  ]);
  httpMock.expectOne('/api/public/team').flush([
    {
      id: 'anna',
      firstName: 'Anna',
      lastName: 'Keller',
      title: null,
      roleDe: null,
      roleEn: null,
      photoUrl: null,
    },
  ]);
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, httpMock };
}

function fillForm(cmp: BookingPageInternals) {
  cmp.selected.set({
    startAt: '2026-06-15T06:00:00.000Z',
    therapistId: 'anna',
    therapistName: 'Anna Keller',
    label: '08:00',
  });
  cmp.name.set('Pat');
  cmp.email.set('pat@example.com');
  cmp.phone.set('+41 00 000 00 00');
  cmp.consent.set(true);
}

describe('BookingPage', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [BookingPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('renders the booking form with the loaded services', async () => {
    const { fixture, httpMock } = await setupComponent();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Termin');
    expect(el.textContent).toContain('Physiotherapie');
    httpMock.verify();
  });

  it('shows a confirmation after a successful booking', async () => {
    const { fixture, httpMock } = await setupComponent();
    fillForm(fixture.componentInstance as unknown as BookingPageInternals);

    const done = (
      fixture.componentInstance as unknown as BookingPageInternals
    ).submit();
    httpMock.expectOne('/api/public/bookings').flush({
      id: 'appt-1',
      startAt: '2026-06-15T06:00:00.000Z',
      endAt: '2026-06-15T06:30:00.000Z',
      status: 'BOOKED',
    });
    await done;
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'bestätigt',
    );
    httpMock.verify();
  });

  it('surfaces a server error (409 conflict)', async () => {
    const { fixture, httpMock } = await setupComponent();
    fillForm(fixture.componentInstance as unknown as BookingPageInternals);

    const done = (
      fixture.componentInstance as unknown as BookingPageInternals
    ).submit();
    httpMock
      .expectOne('/api/public/bookings')
      .flush(
        { statusCode: 409, message: 'The selected slot was just taken' },
        { status: 409, statusText: 'Conflict' },
      );
    await done;
    fixture.detectChanges();

    // The raw (English) backend message is not echoed; a translated message shows.
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'nicht mehr verfügbar',
    );
    httpMock.verify();
  });
});
