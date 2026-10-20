import { Injectable, signal } from '@angular/core';

export const ADMIN_THEME_STORAGE_KEY = 'praxis.admin-theme';

export type AdminTheme = 'dark' | 'light';

const DEFAULT_THEME: AdminTheme = 'dark';

/**
 * Holds the admin area's colour theme as a signal. The admin cockpit defaults to
 * a Solarized dark theme; staff can toggle to light. The choice is remembered per
 * browser via localStorage (best-effort — private mode / blocked storage simply
 * means it isn't remembered).
 *
 * This is scoped to the admin area on purpose: the public site stays light and
 * practice-branded, themed from the config.
 */
@Injectable({ providedIn: 'root' })
export class AdminThemeService {
  private readonly _theme = signal<AdminTheme>(this.readStoredTheme());
  readonly theme = this._theme.asReadonly();

  setTheme(theme: AdminTheme): void {
    this._theme.set(theme);
    try {
      localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
    } catch {
      // Private mode / blocked storage: the choice simply isn't remembered.
    }
  }

  toggle(): void {
    this.setTheme(this._theme() === 'dark' ? 'light' : 'dark');
  }

  private readStoredTheme(): AdminTheme {
    try {
      const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // Ignore and use the default.
    }
    return DEFAULT_THEME;
  }
}
