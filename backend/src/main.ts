import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { configureApp } from './app.setup.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // bufferLogs holds early bootstrap logs until the pino logger is attached, so
  // even startup lines come out as structured JSON instead of Nest's console.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  configureApp(app);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
