import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type AppointmentScope = 'upcoming' | 'past';

export interface AdminAppointmentView {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  serviceName: string;
  therapistId: string;
  therapistName: string;
  /** UTC ISO instants. */
  startAt: string;
  endAt: string;
  status: 'BOOKED' | 'CANCELLED';
}

/**
 * Reception's appointment overview and cancellation. Unlike patient self-service
 * cancellation, an admin cancel ignores the cancellation deadline (the practice
 * must be able to cancel at short notice, e.g. a therapist falls ill).
 */
@Injectable()
export class AdminAppointmentService {
  private readonly logger = new Logger(AdminAppointmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async list(
    scope: AppointmentScope,
    therapistId?: string,
    now = new Date(),
  ): Promise<AdminAppointmentView[]> {
    const upcoming = scope === 'upcoming';
    const appointments = await this.prisma.appointment.findMany({
      where: {
        endAt: upcoming ? { gte: now } : { lt: now },
        ...(therapistId !== undefined ? { therapistId } : {}),
      },
      orderBy: { startAt: upcoming ? 'asc' : 'desc' },
      include: { service: true, therapist: true },
    });
    return appointments.map((a) => ({
      id: a.id,
      patientName: a.patientName,
      patientEmail: a.patientEmail,
      patientPhone: a.patientPhone,
      serviceName: a.service.name,
      therapistId: a.therapistId,
      therapistName: `${a.therapist.firstName} ${a.therapist.lastName}`,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      status: a.status,
    }));
  }

  async cancel(
    id: string,
    now = new Date(),
    restrictToTherapistId?: string,
  ): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { service: true, therapist: true },
    });
    // When restricted (a THERAPIST user), another therapist's appointment is
    // reported as not found — it is not theirs to cancel and its existence isn't
    // revealed.
    if (
      appointment === null ||
      (restrictToTherapistId !== undefined &&
        appointment.therapistId !== restrictToTherapistId)
    ) {
      throw new NotFoundException(`Unknown appointment: ${id}`);
    }
    if (appointment.status === 'CANCELLED') {
      return; // idempotent
    }

    // Conditional update: only the request that flips BOOKED→CANCELLED emails.
    const { count } = await this.prisma.appointment.updateMany({
      where: { id, status: 'BOOKED' },
      data: { status: 'CANCELLED', cancelledAt: now },
    });
    if (count === 0) {
      return;
    }

    // Best-effort: a mail failure must not undo the (committed) cancellation.
    try {
      await this.mail.sendCancellationConfirmation({
        to: appointment.patientEmail,
        patientName: appointment.patientName,
        serviceName: appointment.service.name,
        therapistName: `${appointment.therapist.firstName} ${appointment.therapist.lastName}`,
        startAt: appointment.startAt,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send cancellation confirmation for appointment ${appointment.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
