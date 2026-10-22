import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminAppointmentController } from './admin-appointment.controller.js';
import { AdminAppointmentService } from './admin-appointment.service.js';
import { AdminBlockController } from './admin-block.controller.js';
import { AdminBlockService } from './admin-block.service.js';
import { AdminHoursController } from './admin-hours.controller.js';
import { AdminHoursService } from './admin-hours.service.js';
import { AdminReassignController } from './admin-reassign.controller.js';
import { AdminReassignService } from './admin-reassign.service.js';
import { AdminServiceController } from './admin-service.controller.js';
import { AdminServiceService } from './admin-service.service.js';
import { AdminUserController } from './admin-user.controller.js';
import { AdminUserService } from './admin-user.service.js';
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
    AdminAppointmentController,
    AdminReassignController,
    AdminUserController,
  ],
  providers: [
    AdminTherapistService,
    AdminHoursService,
    AdminReassignService,
    AdminBlockService,
    AdminServiceService,
    AdminAppointmentService,
    AdminUserService,
  ],
})
export class AdminModule {}
