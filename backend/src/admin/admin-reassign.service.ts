import { Injectable, NotFoundException } from '@nestjs/common';
import { practiceConfig } from '@praxis-buchung/config';
import { DateTime } from 'luxon';
import { isConcurrencyConflict } from '../common/concurrency-conflict.js';
import { WEEKDAYS } from '../common/weekdays.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  planReassignment,
  type CandidateWindow,
  type Interval,
  type ReassignCandidate,
  type ReassignWarning,
  type UnassignableReason,
} from './reassign-plan.js';

/** One appointment in the preview, with the proposed target and any warnings. */
export interface ReassignPreviewEntry {
  appointmentId: string;
  serviceId: string;
  startAt: string;
  proposedTargetId: string | null;
  proposedTargetName: string | null;
  warnings: ReassignWarning[];
  unassignableReason?: UnassignableReason;
}

export interface ReassignApplyEntry {
  appointmentId: string;
  targetTherapistId: string;
}

export interface ReassignApplyResult {
  applied: ReassignApplyEntry[];
  failed: { appointmentId: string; reason: string }[];
}

/**
 * Reassigns a departing therapist's FUTURE booked appointments to other
 * therapists. `preview` computes a plan (who could take each appointment, with
 * soft warnings) and writes nothing; `apply` commits the admin's decided
 * assignments, with the database overlap constraint as the final race guard.
 * The appointment's time and room never change — only the therapist.
 */
@Injectable()
export class AdminReassignService {
  constructor(private readonly prisma: PrismaService) {}

  async preview(
    departingId: string,
    targetTherapistIds: string[] | undefined,
    now = new Date(),
  ): Promise<ReassignPreviewEntry[]> {
    await this.ensureTherapist(departingId);
    const appointments = await this.futureAppointments(departingId, now);
    if (appointments.length === 0) return [];

    const candidates = await this.loadCandidates(
      departingId,
      targetTherapistIds,
      appointments,
    );
    const names = new Map(candidates.map((c) => [c.therapistId, c.name]));
    const tz = practiceConfig.timezone;

    const plan = planReassignment({
      appointments: appointments.map((a) => this.toReassignAppointment(a, tz)),
      candidates: candidates.map((c) => c.forPlan),
    });

    const byId = new Map(appointments.map((a) => [a.id, a]));
    return plan.map((entry) => ({
      appointmentId: entry.appointmentId,
      serviceId: byId.get(entry.appointmentId)?.serviceId ?? '',
      startAt: byId.get(entry.appointmentId)?.startAt.toISOString() ?? '',
      proposedTargetId: entry.proposedTargetId,
      proposedTargetName:
        entry.proposedTargetId !== null
          ? (names.get(entry.proposedTargetId) ?? null)
          : null,
      warnings: entry.warnings,
      ...(entry.unassignableReason !== undefined
        ? { unassignableReason: entry.unassignableReason }
        : {}),
    }));
  }

  async apply(
    departingId: string,
    assignments: ReassignApplyEntry[],
    now = new Date(),
  ): Promise<ReassignApplyResult> {
    await this.ensureTherapist(departingId);
    const result: ReassignApplyResult = { applied: [], failed: [] };

    for (const { appointmentId, targetTherapistId } of assignments) {
      // A posted assignment must not move an appointment back onto the departing
      // therapist (preview never proposes this, but apply trusts the input).
      if (targetTherapistId === departingId) {
        result.failed.push({ appointmentId, reason: 'invalid_target' });
        continue;
      }
      try {
        // Only a future, still-booked appointment of the departing therapist may
        // move, and only to a capable, active target. The conditional updateMany
        // (count === 1) also rules out a concurrent cancel/reassign.
        const target = await this.prisma.therapist.findUnique({
          where: { id: targetTherapistId },
          include: { capabilities: true },
        });
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: appointmentId },
        });
        if (
          appointment === null ||
          appointment.therapistId !== departingId ||
          appointment.status !== 'BOOKED' ||
          appointment.startAt.getTime() <= now.getTime()
        ) {
          result.failed.push({ appointmentId, reason: 'not_eligible' });
          continue;
        }
        if (
          target === null ||
          !this.isActiveAt(target, appointment.startAt, appointment.endAt) ||
          !target.capabilities.some(
            (c) => c.serviceId === appointment.serviceId,
          )
        ) {
          result.failed.push({ appointmentId, reason: 'invalid_target' });
          continue;
        }
        const { count } = await this.prisma.appointment.updateMany({
          where: {
            id: appointmentId,
            therapistId: departingId,
            status: 'BOOKED',
          },
          data: { therapistId: targetTherapistId },
        });
        if (count === 1) {
          result.applied.push({ appointmentId, targetTherapistId });
        } else {
          result.failed.push({ appointmentId, reason: 'not_eligible' });
        }
      } catch (error) {
        // The overlap exclusion constraint (or a deadlock/serialization failure
        // under contention) means the target is no longer free for this slot.
        if (isConcurrencyConflict(error)) {
          result.failed.push({ appointmentId, reason: 'conflict' });
        } else {
          throw error;
        }
      }
    }

    return result;
  }

  private async futureAppointments(
    departingId: string,
    now: Date,
  ): Promise<{ id: string; serviceId: string; startAt: Date; endAt: Date }[]> {
    return this.prisma.appointment.findMany({
      where: {
        therapistId: departingId,
        status: 'BOOKED',
        startAt: { gt: now },
      },
      select: { id: true, serviceId: true, startAt: true, endAt: true },
      orderBy: { startAt: 'asc' },
    });
  }

  private async loadCandidates(
    departingId: string,
    targetTherapistIds: string[] | undefined,
    appointments: { startAt: Date; endAt: Date }[],
  ): Promise<
    { therapistId: string; name: string; forPlan: ReassignCandidate }[]
  > {
    // Bound the busy/block queries to the span the appointments cover.
    const rangeStart = new Date(
      Math.min(...appointments.map((a) => a.startAt.getTime())),
    );
    const rangeEnd = new Date(
      Math.max(...appointments.map((a) => a.endAt.getTime())),
    );

    const therapists = await this.prisma.therapist.findMany({
      where: {
        id:
          targetTherapistIds !== undefined
            ? { in: targetTherapistIds.filter((id) => id !== departingId) }
            : { not: departingId },
      },
      include: {
        capabilities: true,
        workingHours: true,
        appointments: {
          where: {
            status: 'BOOKED',
            startAt: { lt: rangeEnd },
            endAt: { gt: rangeStart },
          },
          select: { startAt: true, endAt: true },
        },
        blocks: {
          where: { startAt: { lt: rangeEnd }, endAt: { gt: rangeStart } },
          select: { startAt: true, endAt: true },
        },
      },
    });

    return therapists.map((t) => ({
      therapistId: t.id,
      name: `${t.firstName} ${t.lastName}`,
      forPlan: {
        therapistId: t.id,
        capableServiceIds: t.capabilities.map((c) => c.serviceId),
        activeFrom: t.activeFrom.getTime(),
        activeUntil: t.activeUntil?.getTime() ?? null,
        busy: t.appointments.map(toInterval),
        blocks: t.blocks.map(toInterval),
        workingWindows: t.workingHours.map((w): CandidateWindow => ({
          weekday: w.weekday,
          startMin: w.startMin,
          endMin: w.endMin,
        })),
      },
    }));
  }

  private toReassignAppointment(
    a: { id: string; serviceId: string; startAt: Date; endAt: Date },
    tz: string,
  ): {
    id: string;
    serviceId: string;
    start: number;
    end: number;
    weekday: string;
    localStartMin: number;
    localEndMin: number;
  } {
    const start = DateTime.fromJSDate(a.startAt, { zone: tz });
    const end = DateTime.fromJSDate(a.endAt, { zone: tz });
    return {
      id: a.id,
      serviceId: a.serviceId,
      start: a.startAt.getTime(),
      end: a.endAt.getTime(),
      weekday: WEEKDAYS[start.weekday - 1],
      localStartMin: start.hour * 60 + start.minute,
      localEndMin: end.hour * 60 + end.minute,
    };
  }

  private isActiveAt(
    therapist: { activeFrom: Date; activeUntil: Date | null },
    start: Date,
    end: Date,
  ): boolean {
    if (therapist.activeFrom.getTime() > start.getTime()) return false;
    if (
      therapist.activeUntil !== null &&
      therapist.activeUntil.getTime() < end.getTime()
    ) {
      return false;
    }
    return true;
  }

  private async ensureTherapist(id: string): Promise<void> {
    const therapist = await this.prisma.therapist.findUnique({ where: { id } });
    if (therapist === null) {
      throw new NotFoundException(`Unknown therapist: ${id}`);
    }
  }
}

function toInterval(a: { startAt: Date; endAt: Date }): Interval {
  return { start: a.startAt.getTime(), end: a.endAt.getTime() };
}
