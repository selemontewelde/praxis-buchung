import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { type AuthenticatedAdmin } from './auth.service.js';
import type { RequestWithAdmin } from './session-auth.guard.js';

/**
 * Injects the authenticated principal that SessionAuthGuard attached. Throws if
 * absent (a handler using it without the guard is a programming error), so
 * handlers get a non-optional AuthenticatedAdmin without a non-null assertion.
 */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAdmin => {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    if (request.admin === undefined) {
      throw new UnauthorizedException();
    }
    return request.admin;
  },
);
