import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Let Nest run lifecycle hooks (e.g. PrismaService.onModuleDestroy) on process
  // signals, so a `docker compose down` / SIGTERM disconnects Prisma cleanly.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
