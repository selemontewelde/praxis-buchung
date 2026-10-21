import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { type AdminIdentity, AdminAuthService } from './admin-auth.service';
import { AdminLayout } from './admin-layout';
import { AdminThemeService } from './admin-theme.service';

describe('AdminLayout', () => {
  // An ADMIN sees every section; the stub stands in for a loaded session.
  const authStub = {
    admin: signal<AdminIdentity | null>({
      email: 'a@b.c',
      role: 'ADMIN',
      therapistId: null,
    }).asReadonly(),
    logout: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    authStub.logout.mockClear();
    document.body.removeAttribute('data-admin-theme');
    TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AdminAuthService, useValue: authStub },
      ],
    });
  });

  it('renders the section navigation links', () => {
    const fixture = TestBed.createComponent(AdminLayout);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Übersicht');
    expect(text).toContain('Team verwalten');
    expect(text).toContain('Zeiten verwalten');
    expect(text).toContain('Sperrzeiten');
  });

  it('reflects the theme on <body> and toggles it', () => {
    const fixture = TestBed.createComponent(AdminLayout);
    fixture.detectChanges();
    const theme = TestBed.inject(AdminThemeService);
    expect(document.body.getAttribute('data-admin-theme')).toBe('dark');

    const toggle = (fixture.nativeElement as HTMLElement).querySelector(
      'button.theme-toggle',
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    expect(theme.theme()).toBe('light');
    expect(document.body.getAttribute('data-admin-theme')).toBe('light');
  });

  it('logs out via the auth service', () => {
    const auth = TestBed.inject(AdminAuthService);
    const router = TestBed.inject(Router);
    const logout = vi.spyOn(auth, 'logout').mockResolvedValue(undefined);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(AdminLayout);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button.logout',
    ) as HTMLButtonElement;
    button.click();

    expect(logout).toHaveBeenCalled();
  });
});
