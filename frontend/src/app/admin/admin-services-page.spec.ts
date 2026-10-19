import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminServicesPage } from './admin-services-page';

describe('AdminServicesPage', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [AdminServicesPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('lists services and marks archived ones', async () => {
    const fixture = TestBed.createComponent(AdminServicesPage);
    const httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne('/api/admin/services').flush([
      {
        id: 's1',
        name: 'Massage',
        durationMin: 30,
        descriptionDe: 'Entspannung',
        descriptionEn: 'Relaxation',
        active: true,
      },
      {
        id: 's2',
        name: 'Fango',
        durationMin: 45,
        descriptionDe: null,
        descriptionEn: null,
        active: false,
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Leistungen verwalten');
    // the archived service shows the "archiviert" badge
    expect(el.textContent).toContain('archiviert');
    httpMock.verify();
  });
});
