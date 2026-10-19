import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  type AuthenticatedAdmin,
  AuthService,
  SESSION_COOKIE,
} from './auth.service.js';

export interface RequestWithAdmin extends Request {
  admin?: AuthenticatedAdmin;
}

/** Allows a request only if it carries a valid admin session cookie. */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const cookies = request.cookies as Record<string, string> | undefined;
    const token = cookies?.[SESSION_COOKIE];
    if (token === undefined) {
      throw new UnauthorizedException();
    }
    const admin = await this.auth.validate(token);
    if (admin === null) {
      throw new UnauthorizedException();
    }
    request.admin = admin;
    return true;
  }
}
