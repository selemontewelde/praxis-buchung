import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { practiceConfig } from '@praxis-buchung/config';
import { DateTime } from 'luxon';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SlotService } from '../slots/slot.service.js';

function cancelUrl(token: string): string {
  const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:4200';
  return `${base}/stornieren?token=${token}`;
}

export interface CreateBookingInput {
  serviceId: string;
  therapistId: string;
  /** UTC ISO instant of the slot start. */
  startAt: string;
  patient: { name: string; email: string; phone: string };
  consent: { policyVersion: string };
}

export interface BookingResult {
  id: string;
  startAt: Date;
  endAt: Date;
}

/**
 * True if the error means a concurrent booking lost the race for the slot. Two
 * forms occur: the Postgres exclusion constraint fires cleanly (therapist or room
 * overlap, SQLSTATE 23P01), or the two transactions *deadlock* while checking the
 * exclusion constraints and Postgres aborts one (40P01, surfaced by Prisma as
 * P2034). With two exclusion constraints on the table a deadlock is the more
 * likely outcome under contention; either way the loser's slot was just taken, so
 * both map to a 409 — exactly one booking still commits.
 */
function isConcurrencyConflict(error: unknown): boolean {
  const code = (error as { code?: unknown }).code;
  const text = error instanceof Error ? error.message : String(error);
  return (
    code === 'P2034' || // Prisma: write conflict or deadlock, retry-able
    text.includes('appointment_no_overlap') ||
    text.includes('appointment_room_no_overlap') ||
    text.includes('23P01') || // exclusion_violation
    text.includes('40P01') || // deadlock_detected
    text.includes('40001') // serialization_failure
  );
}

/**
 * Creates appointments. Availability is re-checked against the slot engine (so
 * past / under-lead / out-of-horizon / already-busy requests are rejected), and
 * the database's exclusion constraint is the final guard: if two concurrent
 * requests pass the check and race to insert, exactly one commits and the other
 * fails the constraint and is surfaced as a 409.
 */
@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slots: SlotService,
    private readonly mail: MailService,
  ) {}

  async create(input: CreateBookingInput, now = new Date()): Promise<BookingResult> {
    const service = await this.prisma.service.findUnique({
      where: { id: input.serviceId },
    });
    if (service === null || !service.active) {
      throw new NotFoundException(`Unknown service: ${input.serviceId}`);
    }

    const startAt = new Date(input.startAt);
    const endAt = new Date(startAt.getTime() + service.durationMin * 60_000);

    // Re-validate that this exact start is still an offered slot for this
    // therapist (enforces hours, buffer, lead time and horizon — not just overlap).
    const localDate = DateTime.fromJSDate(startAt, {
      zone: practiceConfig.timezone,
    }).toISODate();
    if (localDate === null) {
      throw new ConflictException('The selected slot is not available');
    }
    const offered = await this.slots.getAvailableSlots({
      serviceId: input.serviceId,
      therapistId: input.therapistId,
      fromDate: localDate,
      toDate: localDate,
      now,
    });
    const forTherapist = offered.find(
      (t) => t.therapistId === input.therapistId,
    );
    if (
      forTherapist === undefined ||
      !forTherapist.slots.includes(startAt.toISOString())
    ) {
      throw new ConflictException('The selected slot is not available');
    }

    const token = randomUUID();
    let result: BookingResult;
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            therapistId: input.therapistId,
            serviceId: input.serviceId,
            // Occupy the service's required room (null when it needs none); the
            // room overlap constraint then guards against a double-booking.
            roomId: service.roomId,
            startAt,
            endAt,
            status: 'BOOKED',
            patientName: input.patient.name,
            patientEmail: input.patient.email,
            patientPhone: input.patient.phone,
            cancellationToken: token,
          },
        });
        await tx.consentRecord.create({
          data: {
            appointmentId: appointment.id,
            policyVersion: input.consent.policyVersion,
            acceptedAt: now,
          },
        });
        return {
          id: appointment.id,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
        };
      });
    } catch (error) {
      if (isConcurrencyConflict(error)) {
        throw new ConflictException('The selected slot was just taken');
      }
      throw error;
    }

    // Best-effort: a mail failure must not fail the (committed) booking.
    try {
      await this.mail.sendBookingConfirmation({
        to: input.patient.email,
        patientName: input.patient.name,
        serviceName: service.name,
        therapistName: `${forTherapist.firstName} ${forTherapist.lastName}`,
        startAt: result.startAt,
        endAt: result.endAt,
        appointmentId: result.id,
        cancelUrl: cancelUrl(token),
      });
    } catch (error) {
      this.logger.error(
        `Failed to send booking confirmation for appointment ${result.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return result;
  }
}
