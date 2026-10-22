import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardPage } from './admin-dashboard-page';

interface PageInternals {
  current: { set: (v: string) => void };
  next: { set: (v: string) => void };
  changePassword: () => Promise<void>;
}

describe('AdminDashboardPage password change', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [AdminDashboardPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('posts the password change and shows a success notice', async () => {
    const fixture = TestBed.createComponent(AdminDashboardPage);
    fixture.detectChanges();
    const httpMock = TestBed.inject(HttpTestingController);
    const cmp = fixture.componentInstance as unknown as PageInternals;

    cmp.current.set('oldpassword1');
    cmp.next.set('newpassword1');
    const done = cmp.changePassword();

    const req = httpMock.expectOne('/api/admin/password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      currentPassword: 'oldpassword1',
      newPassword: 'newpassword1',
    });
    req.flush({ ok: true });
    await done;
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Passwort geändert');
    httpMock.verify();
  });
});
