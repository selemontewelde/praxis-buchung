import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type AdminIdentity, AdminAuthService } from './admin-auth.service';
import { AdminBlocksPage } from './admin-blocks-page';

describe('AdminBlocksPage', () => {
  const adminSig = signal<AdminIdentity | null>(null);

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    adminSig.set({ email: 'a@b.c', role: 'ADMIN', therapistId: null });
    TestBed.configureTestingModule({
      imports: [AdminBlocksPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminAuthService, useValue: { admin: adminSig.asReadonly() } },
      ],
    });
  });

  it('lists upcoming blocks (ADMIN: with the therapist list)', async () => {
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
