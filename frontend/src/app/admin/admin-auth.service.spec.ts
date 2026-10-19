import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sets the admin on login', async () => {
    const p = service.login('a@b.c', 'pw');
    const req = httpMock.expectOne('/api/admin/login');
    expect(req.request.body).toEqual({ email: 'a@b.c', password: 'pw' });
    req.flush({ email: 'a@b.c' });
    await p;
    expect(service.admin()).toEqual({ email: 'a@b.c' });
  });

  it('ensureLoaded queries /me once and caches', async () => {
    const p = service.ensureLoaded();
    httpMock.expectOne('/api/admin/me').flush({ email: 'a@b.c' });
    expect(await p).toEqual({ email: 'a@b.c' });

    await service.ensureLoaded();
    httpMock.expectNone('/api/admin/me');
  });

  it('ensureLoaded yields null when unauthenticated', async () => {
    const p = service.ensureLoaded();
    httpMock
      .expectOne('/api/admin/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(await p).toBeNull();
    expect(service.admin()).toBeNull();
  });

  it('clears the admin on logout', async () => {
    const login = service.login('a@b.c', 'pw');
    httpMock.expectOne('/api/admin/login').flush({ email: 'a@b.c' });
    await login;

    const out = service.logout();
    httpMock.expectOne('/api/admin/logout').flush({ ok: true });
    await out;
    expect(service.admin()).toBeNull();
  });
});
