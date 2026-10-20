import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Footer } from './layout/footer';
import { Header } from './layout/header';
import { I18nService } from './i18n/i18n.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  // The admin area brings its own top bar (AdminLayout), so the public header
  // and footer are hidden there (including /admin/login, which has no chrome).
  // Derived from the active URL on each navigation.
  protected readonly isAdminArea = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.inAdminArea(this.router.url)),
    ),
    { initialValue: this.inAdminArea(this.router.url) },
  );

  // Match the /admin route and its descendants, but not an unrelated path that
  // merely starts with the same letters (e.g. /administration).
  private inAdminArea(url: string): boolean {
    const path = url.split(/[?#]/, 1)[0];
    return path === '/admin' || path.startsWith('/admin/');
  }
}
