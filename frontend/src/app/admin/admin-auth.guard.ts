import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

/** Protects /admin/* — redirects to the login page when there's no session. */
export const adminAuthGuard: CanActivateFn = async () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  const admin = await auth.ensureLoaded();
  return admin !== null ? true : router.createUrlTree(['/admin/login']);
};
