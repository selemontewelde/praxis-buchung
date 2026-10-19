import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
