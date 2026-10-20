import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

/**
 * Applies the shared runtime configuration to the Nest app. Kept separate from
 * main.ts (which starts a server on import) so tests can build an app with the
 * exact same middleware, pipes and proxy settings.
 */
export function configureApp(app: NestExpressApplication): void {
  // Behind the Caddy reverse proxy: trust the first proxy hop so req.ip reflects
  // the real client (X-Forwarded-For), which the rate limiter keys on.
  app.set('trust proxy', 1);
  // Standard security headers (nosniff, frame-deny, HSTS, no-referrer, etc.).
  app.use(helmet());
  // Parse cookies so the admin session guard can read the session cookie.
  app.use(cookieParser());
  // Validate and sanitise all incoming DTOs: strip unknown properties, reject
  // requests that carry them, and transform plain payloads into DTO instances.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Let Nest run lifecycle hooks (e.g. PrismaService.onModuleDestroy) on process
  // signals, so a `docker compose down` / SIGTERM disconnects Prisma cleanly.
  app.enableShutdownHooks();
}
