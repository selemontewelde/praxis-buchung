import { Module } from '@nestjs/common';
import { PublicContentController } from './content.controller.js';
import { PublicPracticeController } from './practice.controller.js';

/** Unauthenticated, read-only endpoints the public website consumes. */
@Module({
  controllers: [PublicPracticeController, PublicContentController],
})
export class PublicModule {}
