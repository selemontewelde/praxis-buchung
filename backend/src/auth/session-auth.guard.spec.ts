import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AuthService } from './auth.service.js';
import { type RequestWithAdmin, SessionAuthGuard } from './session-auth.guard.js';

function contextFor(request: Partial<RequestWithAdmin>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('SessionAuthGuard', () => {
  it('rejects a request without a session cookie', async () => {
    const auth = { validate: vi.fn() } as unknown as AuthService;
    const guard = new SessionAuthGuard(auth);
    await expect(
      guard.canActivate(contextFor({ cookies: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid session token', async () => {
    const auth = { validate: vi.fn().mockResolvedValue(null) } as unknown as AuthService;
    const guard = new SessionAuthGuard(auth);
    await expect(
      guard.canActivate(contextFor({ cookies: { admin_session: 'bad' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows a valid session and attaches the admin', async () => {
    const admin = { id: 'admin-1', email: 'a@b.c' };
    const auth = {
      validate: vi.fn().mockResolvedValue(admin),
    } as unknown as AuthService;
    const guard = new SessionAuthGuard(auth);
    const request: Partial<RequestWithAdmin> = {
      cookies: { admin_session: 'good' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.admin).toEqual(admin);
  });
});
