import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { practiceConfig } from '@praxis-buchung/config';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service.js';
import { SlotService } from '../slots/slot.service.js';

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

/** True if the error is the Postgres exclusion-constraint (overlap) violation. */
function isOverlapViolation(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  // SQLSTATE 23P01 = exclusion_violation; the constraint name is also distinctive.
  return text.includes('appointment_no_overlap') || text.includes('23P01');
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly slots: SlotService,
  ) {}

  async create(input: CreateBookingInput, now = new Date()): Promise<BookingResult> {
    const service = await this.prisma.service.findUnique({
      where: { id: input.serviceId },
    });
    if (service === null) {
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
    if (!forTherapist?.slots.includes(startAt.toISOString())) {
      throw new ConflictException('The selected slot is not available');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            therapistId: input.therapistId,
            serviceId: input.serviceId,
            startAt,
            endAt,
            status: 'BOOKED',
            patientName: input.patient.name,
            patientEmail: input.patient.email,
            patientPhone: input.patient.phone,
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
      if (isOverlapViolation(error)) {
        throw new ConflictException('The selected slot was just taken');
      }
      throw error;
    }
  }
}
