import {
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { practiceConfig } from '@praxis-buchung/config';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CancellationView {
  serviceName: string;
  therapistName: string;
  /** Appointment start as a UTC ISO instant. */
  startAt: string;
  status: 'BOOKED' | 'CANCELLED';
  /** Whether the appointment can still be cancelled right now. */
  cancellable: boolean;
}

/**
 * Self-service cancellation via the single-use token in the confirmation email.
 * Cancelling sets the status to CANCELLED, which (through the partial exclusion
 * constraint) frees the slot for rebooking, and sends a cancellation email.
 */
@Injectable()
export class CancellationService {
  private readonly logger = new Logger(CancellationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** The instant after which cancellation is no longer allowed. */
  private deadline(startAt: Date): number {
    return (
      startAt.getTime() -
      practiceConfig.booking.cancellationDeadlineHours * 3_600_000
    );
  }

  async view(token: string, now = new Date()): Promise<CancellationView> {
    const appointment = await this.load(token);
    return {
      serviceName: appointment.service.name,
      therapistName: `${appointment.therapist.firstName} ${appointment.therapist.lastName}`,
      startAt: appointment.startAt.toISOString(),
      status: appointment.status,
      cancellable:
        appointment.status === 'BOOKED' &&
        now.getTime() < this.deadline(appointment.startAt),
    };
  }

  async cancel(token: string, now = new Date()): Promise<void> {
    const appointment = await this.load(token);
    if (appointment.status === 'CANCELLED') {
      return; // idempotent: the link may be clicked twice
    }
    if (now.getTime() >= this.deadline(appointment.startAt)) {
      throw new GoneException('The cancellation deadline has passed');
    }

    // Conditional update guards against two concurrent clicks: only the request
    // that flips BOOKED→CANCELLED (count === 1) proceeds to email; the loser
    // updates nothing and stops, so the patient isn't emailed twice.
    const { count } = await this.prisma.appointment.updateMany({
      where: { id: appointment.id, status: 'BOOKED' },
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
        `Failed to send cancellation confirmation to ${appointment.patientEmail}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async load(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { cancellationToken: token },
      include: { service: true, therapist: true },
    });
    if (appointment === null) {
      throw new NotFoundException('Unknown or expired cancellation link');
    }
    return appointment;
  }
}
