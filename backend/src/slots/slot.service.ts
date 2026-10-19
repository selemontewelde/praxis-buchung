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
    if (service === null) {
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
    // The UTC range covering [fromDate, toDate] in local time, both bounds built
    // the same way: local midnight of fromDate and of the day after toDate.
    const rangeStart = zonedMinutesToUtc(fromDate, 0, timezone);
    const dayAfterTo = DateTime.fromISO(toDate, { zone: timezone })
      .plus({ days: 1 })
      .toISODate();
    if (dayAfterTo === null) {
      throw new Error(`Invalid toDate: ${toDate}`);
    }
    const rangeEnd = zonedMinutesToUtc(dayAfterTo, 0, timezone);

    const therapistIds = activeTherapists.map((t) => t.id);
    const [appointments, blocks] = await Promise.all([
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
    ]);

    const dates = this.enumerateDates(fromDate, toDate, timezone);

    return activeTherapists.map((therapist) => {
      const busyForTherapist = [...appointments, ...blocks].filter(
        (b) => b.therapistId === therapist.id,
      );
      const slots: string[] = [];

      for (const date of dates) {
        const weekday = WEEKDAYS[DateTime.fromISO(date, { zone: timezone }).weekday - 1];
        const openingWindows = this.windowsFor(openingHours, weekday);
        const workingWindows = this.windowsFor(therapist.workingHours, weekday);
        if (openingWindows.length === 0 || workingWindows.length === 0) {
          continue;
        }

        // Appointments and blocks fall within opening hours (never overnight),
        // so each starts and ends on the same local day; match by that day.
        // Overnight spans are out of scope for this practice.
        const busyIntervals = busyForTherapist
          .filter(
            (b) =>
              DateTime.fromJSDate(b.startAt, { zone: timezone }).toISODate() ===
              date,
          )
          .map((b) => ({
            startMin: utcToZonedMinutes(b.startAt, timezone),
            endMin: utcToZonedMinutes(b.endAt, timezone),
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
