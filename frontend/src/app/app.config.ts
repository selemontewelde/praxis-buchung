import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { PracticeService } from './core/practice.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    // Load branding/contact/legal before the app renders, so the site is themed
    // from the first paint. `load()` never rejects, so a backend outage does not
    // block bootstrap.
    provideAppInitializer(() => inject(PracticeService).load()),
  ],
};
