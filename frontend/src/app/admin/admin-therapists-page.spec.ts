import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminTherapistsPage } from './admin-therapists-page';

describe('AdminTherapistsPage', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [AdminTherapistsPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('renders therapists and their capability checkboxes', async () => {
    const fixture = TestBed.createComponent(AdminTherapistsPage);
    const httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne('/api/public/services').flush([
      {
        id: 'physio',
        name: 'Physiotherapie',
        durationMin: 30,
        description: null,
      },
    ]);
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
        capabilityServiceIds: ['physio'],
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Anna Keller');
    expect(el.textContent).toContain('Physiotherapie');
    const checkbox = el.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    expect(checkbox?.checked).toBe(true);
    httpMock.verify();
  });
});
