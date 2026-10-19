import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminBlocksPage } from './admin-blocks-page';

describe('AdminBlocksPage', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [AdminBlocksPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('lists upcoming blocks', async () => {
    const fixture = TestBed.createComponent(AdminBlocksPage);
    const httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne('/api/admin/therapists').flush([]);
    await fixture.whenStable();
    httpMock.expectOne('/api/admin/blocks').flush([
      {
        id: 'b1',
        therapistId: 'anna',
        therapistName: 'Anna Keller',
        reason: 'VACATION',
        startAt: '2026-07-10T08:00:00.000Z',
        endAt: '2026-07-17T08:00:00.000Z',
        note: null,
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Anna Keller');
    expect(el.textContent).toContain('Urlaub');
    httpMock.verify();
  });
});
