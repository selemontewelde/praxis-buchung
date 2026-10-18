import { Module } from '@nestjs/common';
import { PublicPracticeController } from './practice.controller.js';

/** Unauthenticated, read-only endpoints the public website consumes. */
@Module({
  controllers: [PublicPracticeController],
})
export class PublicModule {}
