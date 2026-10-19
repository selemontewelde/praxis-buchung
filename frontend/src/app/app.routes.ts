import { Routes } from '@angular/router';

// German URL slugs for the public pages; each page is lazily loaded.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/start-page').then((m) => m.StartPage),
  },
  {
    path: 'leistungen',
    loadComponent: () =>
      import('./pages/services-page').then((m) => m.ServicesPage),
  },
  {
    path: 'team',
    loadComponent: () => import('./pages/team-page').then((m) => m.TeamPage),
  },
  {
    path: 'termin',
    loadComponent: () =>
      import('./pages/booking-page').then((m) => m.BookingPage),
  },
  {
    path: 'stornieren',
    loadComponent: () =>
      import('./pages/cancellation-page').then((m) => m.CancellationPage),
  },
  {
    path: 'kontakt',
    loadComponent: () =>
      import('./pages/contact-page').then((m) => m.ContactPage),
  },
  {
    path: 'impressum',
    loadComponent: () =>
      import('./pages/impressum-page').then((m) => m.ImpressumPage),
  },
  {
    path: 'datenschutz',
    loadComponent: () =>
      import('./pages/privacy-page').then((m) => m.PrivacyPage),
  },
  { path: '**', redirectTo: '' },
];
