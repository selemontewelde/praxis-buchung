import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminUsersPage } from './admin-users-page';

interface PageInternals {
  email: { set: (v: string) => void };
  password: { set: (v: string) => void };
  create: () => Promise<void>;
}

const THERAPISTS = [
  {
    id: 'anna',
    firstName: 'Anna',
    lastName: 'Keller',
    title: null,
    role: { de: 'r', en: 'r' },
    photoUrl: null,
    activeFrom: '2024-01-01T00:00:00.000Z',
    activeUntil: null,
    capabilityServiceIds: [],
  },
];

describe('AdminUsersPage', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [AdminUsersPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('lists the back-office logins', async () => {
    const fixture = TestBed.createComponent(AdminUsersPage);
    const httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne('/api/admin/therapists').flush(THERAPISTS);
    await fixture.whenStable();
    httpMock.expectOne('/api/admin/users').flush([
      {
        id: 'u1',
        email: 'admin@example.com',
        role: 'ADMIN',
        therapistId: null,
        therapistName: null,
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('admin@example.com');
    httpMock.verify();
  });

  it('creates an admin login', async () => {
    const fixture = TestBed.createComponent(AdminUsersPage);
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne('/api/admin/therapists').flush(THERAPISTS);
    await fixture.whenStable();
    httpMock.expectOne('/api/admin/users').flush([]);
    await fixture.whenStable();

    const cmp = fixture.componentInstance as unknown as PageInternals;
    cmp.email.set('new@example.com');
    cmp.password.set('password1');
    const done = cmp.create();

    const post = httpMock.expectOne('/api/admin/users');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      email: 'new@example.com',
      password: 'password1',
      role: 'ADMIN',
    });
    post.flush({ id: 'u2' });
    await fixture.whenStable();
    httpMock.expectOne('/api/admin/users').flush([]); // reload after create
    await done;
    httpMock.verify();
  });
});
