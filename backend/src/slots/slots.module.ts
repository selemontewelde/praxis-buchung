import { Module } from '@nestjs/common';
import { SlotService } from './slot.service.js';

/** Provides the slot-calculation engine. Consumed by the booking flow in M5. */
@Module({
  providers: [SlotService],
  exports: [SlotService],
})
export class SlotsModule {}
