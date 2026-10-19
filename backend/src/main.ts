import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
