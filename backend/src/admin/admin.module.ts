import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminTherapistController } from './admin-therapist.controller.js';
import { AdminTherapistService } from './admin-therapist.service.js';

/** Authenticated admin management endpoints (reception back office). */
@Module({
  imports: [AuthModule],
  controllers: [AdminTherapistController],
  providers: [AdminTherapistService],
})
export class AdminModule {}
