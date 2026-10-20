import { Routes } from '@angular/router';
import { adminAuthGuard } from './admin/admin-auth.guard';

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
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin/admin-login-page').then((m) => m.AdminLoginPage),
  },
  {
    // The admin shell wraps every /admin/* page in the themed top-bar layout.
    // The guard sits on the parent, so all children inherit authentication.
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admin/admin-dashboard-page').then(
            (m) => m.AdminDashboardPage,
          ),
      },
      {
        path: 'therapists',
        loadComponent: () =>
          import('./admin/admin-therapists-page').then(
            (m) => m.AdminTherapistsPage,
          ),
      },
      {
        path: 'hours',
        loadComponent: () =>
          import('./admin/admin-hours-page').then((m) => m.AdminHoursPage),
      },
      {
        path: 'blocks',
        loadComponent: () =>
          import('./admin/admin-blocks-page').then((m) => m.AdminBlocksPage),
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./admin/admin-services-page').then(
            (m) => m.AdminServicesPage,
          ),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./admin/admin-appointments-page').then(
            (m) => m.AdminAppointmentsPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
