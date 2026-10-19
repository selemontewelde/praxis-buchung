import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminBlockController } from './admin-block.controller.js';
import { AdminBlockService } from './admin-block.service.js';
import { AdminHoursController } from './admin-hours.controller.js';
import { AdminHoursService } from './admin-hours.service.js';
import { AdminServiceController } from './admin-service.controller.js';
import { AdminServiceService } from './admin-service.service.js';
import { AdminTherapistController } from './admin-therapist.controller.js';
import { AdminTherapistService } from './admin-therapist.service.js';

/** Authenticated admin management endpoints (reception back office). */
@Module({
  imports: [AuthModule],
  controllers: [
    AdminTherapistController,
    AdminHoursController,
    AdminBlockController,
    AdminServiceController,
  ],
  providers: [
    AdminTherapistService,
    AdminHoursService,
    AdminBlockService,
    AdminServiceService,
  ],
})
export class AdminModule {}
