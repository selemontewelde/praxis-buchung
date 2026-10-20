import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AdminThemeService, ADMIN_THEME_STORAGE_KEY } from './admin-theme.service';

describe('AdminThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  function create(): AdminThemeService {
    return TestBed.inject(AdminThemeService);
  }

  it('defaults to dark when nothing is stored', () => {
    expect(create().theme()).toBe('dark');
  });

  it('restores a stored theme', () => {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, 'light');
    expect(create().theme()).toBe('light');
  });

  it('falls back to dark for an invalid stored value', () => {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, 'neon');
    expect(create().theme()).toBe('dark');
  });

  it('toggle flips the theme and persists the choice', () => {
    const service = create();
    service.toggle();
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe('light');
    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe('dark');
  });

  it('setTheme sets and persists an explicit theme', () => {
    const service = create();
    service.setTheme('light');
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe('light');
  });

  it('keeps working when storage access throws', () => {
    const getSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    const setSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });

    const service = create();
    expect(service.theme()).toBe('dark');
    expect(() => service.toggle()).not.toThrow();
    expect(service.theme()).toBe('light');

    getSpy.mockRestore();
    setSpy.mockRestore();
  });
});
