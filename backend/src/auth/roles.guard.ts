import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator.js';
import type { RequestWithAdmin } from './session-auth.guard.js';

/**
 * Enforces the @Roles marker. Runs after SessionAuthGuard, so request.admin is
 * set; a handler/controller with no marker is open to any authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles =
      this.reflector.get(Roles, context.getHandler()) ??
      this.reflector.get(Roles, context.getClass());
    if (roles === undefined || roles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const admin = request.admin;
    if (admin === undefined || !roles.includes(admin.role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
