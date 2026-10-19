import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BookingApiService, type BookingPayload } from './booking-api.service';

describe('BookingApiService', () => {
  let service: BookingApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('builds the slots query with the optional therapist', async () => {
    const promise = service.getSlots({
      serviceId: 'physio',
      therapistId: 'anna',
      from: '2026-06-15',
      to: '2026-06-15',
    });
    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/public/slots' &&
        r.params.get('serviceId') === 'physio' &&
        r.params.get('therapistId') === 'anna' &&
        r.params.get('from') === '2026-06-15',
    );
    req.flush([]);
    expect(await promise).toEqual([]);
  });

  it('omits therapistId when not given', async () => {
    const promise = service.getSlots({
      serviceId: 'physio',
      from: '2026-06-15',
      to: '2026-06-15',
    });
    const req = httpMock.expectOne(
      (r) => r.url === '/api/public/slots' && !r.params.has('therapistId'),
    );
    req.flush([]);
    await promise;
  });

  it('posts a booking and returns the confirmation', async () => {
    const payload: BookingPayload = {
      serviceId: 'physio',
      therapistId: 'anna',
      startAt: '2026-06-15T06:00:00.000Z',
      patient: { name: 'Pat', email: 'pat@example.com', phone: '+41 0' },
      consent: { policyVersion: '2025-01', accepted: true },
    };
    const promise = service.createBooking(payload);
    const req = httpMock.expectOne('/api/public/bookings');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      id: 'appt-1',
      startAt: payload.startAt,
      endAt: '2026-06-15T06:30:00.000Z',
      status: 'BOOKED',
    });
    expect((await promise).id).toBe('appt-1');
  });

  it('propagates a server error (e.g. 409 conflict)', async () => {
    const promise = service.createBooking({
      serviceId: 'physio',
      therapistId: 'anna',
      startAt: '2026-06-15T06:00:00.000Z',
      patient: { name: 'Pat', email: 'pat@example.com', phone: '+41 0' },
      consent: { policyVersion: '2025-01', accepted: true },
    });
    httpMock
      .expectOne('/api/public/bookings')
      .flush(
        { statusCode: 409, message: 'The selected slot was just taken' },
        { status: 409, statusText: 'Conflict' },
      );
    await expect(promise).rejects.toMatchObject({ status: 409 });
  });
});
