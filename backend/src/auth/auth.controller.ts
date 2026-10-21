import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService, SESSION_COOKIE } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import {
  type RequestWithAdmin,
  SessionAuthGuard,
} from './session-auth.guard.js';

function cookieOptions(expiresAt?: Date): CookieOptions {
  return {
    httpOnly: true,
    // Secure requires HTTPS; local dev is http, so only enforce in production.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(expiresAt !== undefined ? { expires: expiresAt } : {}),
  };
}

@Controller('api/admin')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Throttle login to blunt password brute-forcing (10 attempts/min per client).
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ email: string }> {
    const { token, expiresAt } = await this.auth.login(dto.email, dto.password);
    res.cookie(SESSION_COOKIE, token, cookieOptions(expiresAt));
    return { email: dto.email };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.[SESSION_COOKIE];
    if (token !== undefined) {
      await this.auth.logout(token);
    }
    res.clearCookie(SESSION_COOKIE, cookieOptions());
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  me(@Req() req: RequestWithAdmin): {
    email: string;
    role: 'ADMIN' | 'THERAPIST';
    therapistId: string | null;
  } {
    const admin = req.admin;
    return {
      email: admin?.email ?? '',
      role: admin?.role ?? 'ADMIN',
      therapistId: admin?.therapistId ?? null,
    };
  }
}
