import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AdminLoginPage } from './admin-login-page';

interface LoginInternals {
  email: { set: (v: string) => void };
  password: { set: (v: string) => void };
  submit: () => Promise<void>;
}

describe('AdminLoginPage', () => {
  const navigateByUrl = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    navigateByUrl.mockClear();
    TestBed.configureTestingModule({
      imports: [AdminLoginPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
  });

  it('logs in and navigates to the dashboard', async () => {
    const fixture = TestBed.createComponent(AdminLoginPage);
    const httpMock = TestBed.inject(HttpTestingController);
    const cmp = fixture.componentInstance as unknown as LoginInternals;
    cmp.email.set('a@b.c');
    cmp.password.set('pw');

    const done = cmp.submit();
    httpMock.expectOne('/api/admin/login').flush({ email: 'a@b.c' });
    // login() then fetches the full identity from /me (dispatched next tick).
    await new Promise((resolve) => setTimeout(resolve));
    httpMock
      .expectOne('/api/admin/me')
      .flush({ email: 'a@b.c', role: 'ADMIN', therapistId: null });
    await done;

    expect(navigateByUrl).toHaveBeenCalledWith('/admin');
    httpMock.verify();
  });

  it('shows an error on failed login', async () => {
    const fixture = TestBed.createComponent(AdminLoginPage);
    const httpMock = TestBed.inject(HttpTestingController);
    const cmp = fixture.componentInstance as unknown as LoginInternals;
    cmp.email.set('a@b.c');
    cmp.password.set('wrong');

    const done = cmp.submit();
    httpMock
      .expectOne('/api/admin/login')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await done;
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'fehlgeschlagen',
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
    httpMock.verify();
  });
});
