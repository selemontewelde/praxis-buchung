import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BookingModule } from './booking/booking.module.js';
import { HealthModule } from './health/health.module.js';
import { MailModule } from './mail/mail.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PublicModule } from './public/public.module.js';
import { ReminderModule } from './reminder/reminder.module.js';
import { SlotsModule } from './slots/slots.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // Rate limiting. A moderate app-wide default (120 requests/minute per client);
    // sensitive endpoints tighten this with @Throttle (booking, admin login).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    PrismaModule,
    MailModule,
    HealthModule,
    PublicModule,
    SlotsModule,
    BookingModule,
    ReminderModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Enforce the throttler globally; per-route limits override the default.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
