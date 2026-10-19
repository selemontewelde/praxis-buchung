import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminHoursPage } from './admin-hours-page';

describe('AdminHoursPage', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [AdminHoursPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('loads and renders the opening-hours windows', async () => {
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
        roleDe: 'r',
        roleEn: 'r',
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
});
