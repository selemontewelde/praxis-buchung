import { Injectable } from '@nestjs/common';
import { practiceConfig } from '@praxis-buchung/config';
import { DateTime } from 'luxon';
import { isActive } from '../public/active-range.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { applyBuffer, withinBookingWindow } from './policies.js';
import { computeSlots, type Interval } from './slot-engine.js';
import { utcToZonedMinutes, zonedMinutesToUtc } from './timezone.js';

export interface GetSlotsParams {
  serviceId: string;
  /** Optional: restrict to a single therapist. */
  therapistId?: string;
  /** Inclusive local date range, 'YYYY-MM-DD'. */
  fromDate: string;
  toDate: string;
  /** Injectable "now" for the lead-time/horizon window (defaults to the clock). */
  now?: Date;
}

export interface TherapistSlots {
  therapistId: string;
  firstName: string;
  lastName: string;
  /** Bookable slot start instants, as UTC ISO strings. */
  slots: string[];
}

const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

/**
 * Computes bookable slots from the database, wiring the pure slot engine
 * (#11) together with the timezone mapping and booking policies (buffer, lead
 * time, horizon) and the active-range + capability filters. The practice's grid,
 * buffer, lead, horizon and timezone come from the config.
 */
@Injectable()
export class SlotService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableSlots(params: GetSlotsParams): Promise<TherapistSlots[]> {
    const { serviceId, therapistId, fromDate, toDate } = params;
    const now = params.now ?? new Date();
    const { timezone, booking } = practiceConfig;

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    // An unknown or archived service yields no availability (empty), not an error:
    // serviceId is a free-form identifier and callers treat "no slots" uniformly.
    if (service === null || !service.active) {
      return [];
    }

    // Only therapists who can deliver this service (capability) are considered;
    // the active-range filter is applied below.
    const therapists = await this.prisma.therapist.findMany({
      where: {
        capabilities: { some: { serviceId } },
        ...(therapistId !== undefined ? { id: therapistId } : {}),
      },
      include: { workingHours: true },
    });
    const activeTherapists = therapists.filter((t) => isActive(t, now));
    if (activeTherapists.length === 0) {
      return [];
    }

    const openingHours = await this.prisma.openingHours.findMany();

    // Clamp the requested range to the bookable window [today, today + horizon] in
    // the practice timezone. Days outside it produce no slots anyway (the lead-time
    // and horizon filters drop them), so clamping keeps a huge requested range from
    // forcing pointless day iteration without changing the result.
    const nowLocal = DateTime.fromJSDate(now, { zone: timezone });
    const todayLocal = nowLocal.toISODate();
    const horizonLocal = nowLocal
      .plus({ days: booking.horizonDays })
      .toISODate();
    if (todayLocal === null || horizonLocal === null) {
      throw new Error('Could not resolve the local booking window');
    }
    const effectiveFrom = fromDate > todayLocal ? fromDate : todayLocal;
    const effectiveTo = toDate < horizonLocal ? toDate : horizonLocal;
    const dates =
      effectiveFrom > effectiveTo
        ? []
        : this.enumerateDates(effectiveFrom, effectiveTo, timezone);

    // UTC bounds for the busy-interval queries, aligned to the clamped range:
    // local midnight of effectiveFrom and of the day after effectiveTo.
    const rangeStart = zonedMinutesToUtc(effectiveFrom, 0, timezone);
    const dayAfterTo = DateTime.fromISO(effectiveTo, { zone: timezone })
      .plus({ days: 1 })
      .toISODate();
    const rangeEnd =
      dayAfterTo === null
        ? rangeStart
        : zonedMinutesToUtc(dayAfterTo, 0, timezone);

    const therapistIds = activeTherapists.map((t) => t.id);
    const [appointments, blocks, roomAppointments] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          therapistId: { in: therapistIds },
          status: 'BOOKED',
          startAt: { lt: rangeEnd },
          endAt: { gt: rangeStart },
        },
      }),
      this.prisma.block.findMany({
        where: {
          therapistId: { in: therapistIds },
          startAt: { lt: rangeEnd },
          endAt: { gt: rangeStart },
        },
      }),
      // If this service needs a room, every BOOKED appointment in that room —
      // whichever therapist made it — occupies the room and must block the slot.
      // Rooms have no opening hours of their own; they are simply single-occupancy.
      service.roomId !== null
        ? this.prisma.appointment.findMany({
            where: {
              roomId: service.roomId,
              status: 'BOOKED',
              startAt: { lt: rangeEnd },
              endAt: { gt: rangeStart },
            },
          })
        : Promise.resolve([]),
    ]);

    return activeTherapists.map((therapist) => {
      const busyForTherapist = [
        // This therapist's own appointments and blocks...
        ...[...appointments, ...blocks].filter(
          (b) => b.therapistId === therapist.id,
        ),
        // ...plus every appointment occupying the required room, regardless of
        // therapist (the room is shared and single-occupancy). Any duplicate of
        // this therapist's own room appointment is harmless — the engine only
        // checks for overlap.
        ...roomAppointments,
      ];
      const slots: string[] = [];

      for (const date of dates) {
        const weekday = WEEKDAYS[DateTime.fromISO(date, { zone: timezone }).weekday - 1];
        const openingWindows = this.windowsFor(openingHours, weekday);
        const workingWindows = this.windowsFor(therapist.workingHours, weekday);
        if (openingWindows.length === 0 || workingWindows.length === 0) {
          continue;
        }

        // A busy interval (appointment or block) covers this day if it overlaps
        // [dayStart, dayEnd). Map it to minutes-of-day, clamping multi-day spans
        // (e.g. a week's holiday block) to the whole day at the boundaries so
        // interior days are fully busy.
        const dayStart = zonedMinutesToUtc(date, 0, timezone);
        const nextDate = DateTime.fromISO(date, { zone: timezone })
          .plus({ days: 1 })
          .toISODate();
        const dayEnd =
          nextDate === null
            ? dayStart
            : zonedMinutesToUtc(nextDate, 0, timezone);
        const busyIntervals = busyForTherapist
          .filter(
            (b) =>
              b.startAt.getTime() < dayEnd.getTime() &&
              b.endAt.getTime() > dayStart.getTime(),
          )
          .map((b) => ({
            startMin:
              b.startAt.getTime() <= dayStart.getTime()
                ? 0
                : utcToZonedMinutes(b.startAt, timezone),
            endMin:
              b.endAt.getTime() >= dayEnd.getTime()
                ? 1440
                : utcToZonedMinutes(b.endAt, timezone),
          }));

        const startMinutes = computeSlots({
          openingWindows,
          workingWindows,
          busyIntervals: applyBuffer(busyIntervals, booking.bufferMin),
          gridMin: booking.gridMin,
          durationMin: service.durationMin,
        });

        for (const startMin of startMinutes) {
          const instant = zonedMinutesToUtc(date, startMin, timezone);
          if (
            withinBookingWindow(
              instant,
              now,
              booking.minLeadMinutes,
              booking.horizonDays,
            )
          ) {
            slots.push(instant.toISOString());
          }
        }
      }

      return {
        therapistId: therapist.id,
        firstName: therapist.firstName,
        lastName: therapist.lastName,
        slots,
      };
    });
  }

  private windowsFor(
    windows: { weekday: string; startMin: number; endMin: number }[],
    weekday: string,
  ): Interval[] {
    return windows
      .filter((w) => w.weekday === weekday)
      .map((w) => ({ startMin: w.startMin, endMin: w.endMin }));
  }

  private enumerateDates(
    fromDate: string,
    toDate: string,
    zone: string,
  ): string[] {
    const dates: string[] = [];
    let cursor = DateTime.fromISO(fromDate, { zone });
    const end = DateTime.fromISO(toDate, { zone });
    while (cursor <= end) {
      const iso = cursor.toISODate();
      if (iso !== null) {
        dates.push(iso);
      }
      cursor = cursor.plus({ days: 1 });
    }
    return dates;
  }
}
