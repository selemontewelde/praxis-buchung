import { Module } from '@nestjs/common';
import { SlotsModule } from '../slots/slots.module.js';
import { PublicContentController } from './content.controller.js';
import { PublicPracticeController } from './practice.controller.js';
import { PublicSlotsController } from './slots.controller.js';

/** Unauthenticated, read-only endpoints the public website consumes. */
@Module({
  imports: [SlotsModule],
  controllers: [
    PublicPracticeController,
    PublicContentController,
    PublicSlotsController,
  ],
})
export class PublicModule {}
