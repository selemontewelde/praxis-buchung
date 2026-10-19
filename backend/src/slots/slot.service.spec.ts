import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SlotService } from './slot.service.js';

/** Working/opening windows repeated for every weekday, so any test date works. */
function everyWeekday(startMin: number, endMin: number) {
  return [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ].map((weekday) => ({ weekday, startMin, endMin }));
}

function makePrisma(over: {
  appointments?: unknown[];
  blocks?: unknown[];
}): PrismaService {
  const anna = {
    id: 'anna',
    firstName: 'Anna',
    lastName: 'Keller',
    activeFrom: new Date('2024-01-01'),
    activeUntil: null,
    workingHours: everyWeekday(480, 600), // 08:00–10:00
  };
  const gone = {
    id: 'gone',
    firstName: 'Gone',
    lastName: 'Away',
    activeFrom: new Date('2024-01-01'),
    activeUntil: new Date('2025-01-01'), // departed → inactive
    workingHours: everyWeekday(480, 600),
  };
  return {
    service: {
      findUnique: vi
        .fn()
        .mockResolvedValue({ id: 'physio', durationMin: 30, active: true }),
    },
    therapist: { findMany: vi.fn().mockResolvedValue([anna, gone]) },
    openingHours: { findMany: vi.fn().mockResolvedValue(everyWeekday(480, 720)) },
    appointment: { findMany: vi.fn().mockResolvedValue(over.appointments ?? []) },
    block: { findMany: vi.fn().mockResolvedValue(over.blocks ?? []) },
  } as unknown as PrismaService;
}

const MONDAY = '2026-06-15';
const NOW = new Date('2026-06-15T00:00:00.000Z'); // 02:00 local; lead window clears the morning

describe('SlotService.getAvailableSlots', () => {
  it('offers only active, capable therapists on the grid within opening∩working hours', async () => {
    const service = new SlotService(makePrisma({}));

    const result = await service.getAvailableSlots({
      serviceId: 'physio',
      fromDate: MONDAY,
      toDate: MONDAY,
      now: NOW,
    });

    expect(result).toHaveLength(1); // 'gone' is filtered out by the active range
    expect(result[0].therapistId).toBe('anna');
    // 08:00–10:00, grid 15, duration 30 → 08:00..09:30 local = 06:00..07:30 UTC.
    expect(result[0].slots).toEqual([
      '2026-06-15T06:00:00.000Z',
      '2026-06-15T06:15:00.000Z',
      '2026-06-15T06:30:00.000Z',
      '2026-06-15T06:45:00.000Z',
      '2026-06-15T07:00:00.000Z',
      '2026-06-15T07:15:00.000Z',
      '2026-06-15T07:30:00.000Z',
    ]);
  });

  it('removes slots around a booked appointment (buffer applied)', async () => {
    // Appointment 09:00–09:30 local (07:00–07:30 UTC); buffer 10 min blocks
    // 08:50–09:40, so only 08:00 and 08:15 survive.
    const service = new SlotService(
      makePrisma({
        appointments: [
          {
            therapistId: 'anna',
            status: 'BOOKED',
            startAt: new Date('2026-06-15T07:00:00.000Z'),
            endAt: new Date('2026-06-15T07:30:00.000Z'),
          },
        ],
      }),
    );

    const result = await service.getAvailableSlots({
      serviceId: 'physio',
      fromDate: MONDAY,
      toDate: MONDAY,
      now: NOW,
    });

    expect(result[0].slots).toEqual([
      '2026-06-15T06:00:00.000Z',
      '2026-06-15T06:15:00.000Z',
    ]);
  });

  it('queries only therapists capable of the service', async () => {
    const prisma = makePrisma({});
    await new SlotService(prisma).getAvailableSlots({
      serviceId: 'physio',
      fromDate: MONDAY,
      toDate: MONDAY,
      now: NOW,
    });

    const therapist = prisma.therapist as unknown as {
      findMany: ReturnType<typeof vi.fn>;
    };
    expect(therapist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          capabilities: { some: { serviceId: 'physio' } },
        }),
      }),
    );
  });

  it('clamps a past date range to the bookable window (no slots, no runaway iteration)', async () => {
    // Range entirely in the past relative to NOW → clamped away → empty.
    const service = new SlotService(makePrisma({}));
    const result = await service.getAvailableSlots({
      serviceId: 'physio',
      fromDate: '2020-01-01',
      toDate: '2020-01-10',
      now: NOW,
    });
    expect(result[0].slots).toEqual([]);
  });

  it('removes all slots on a day fully covered by a multi-day block', async () => {
    // A block from the day before to the day after covers MONDAY entirely.
    const service = new SlotService(
      makePrisma({
        blocks: [
          {
            therapistId: 'anna',
            startAt: new Date('2026-06-14T00:00:00.000Z'),
            endAt: new Date('2026-06-16T00:00:00.000Z'),
          },
        ],
      }),
    );

    const result = await service.getAvailableSlots({
      serviceId: 'physio',
      fromDate: MONDAY,
      toDate: MONDAY,
      now: NOW,
    });

    expect(result[0].slots).toEqual([]);
  });

  it('returns nothing for an archived (inactive) service', async () => {
    const prisma = {
      service: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'physio', durationMin: 30, active: false }),
      },
    } as unknown as PrismaService;

    const result = await new SlotService(prisma).getAvailableSlots({
      serviceId: 'physio',
      fromDate: MONDAY,
      toDate: MONDAY,
      now: NOW,
    });

    expect(result).toEqual([]);
  });

  it('returns nothing for an unknown service', async () => {
    const prisma = makePrisma({});
    (prisma.service.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    const service = new SlotService(prisma);

    expect(
      await service.getAvailableSlots({
        serviceId: 'nope',
        fromDate: MONDAY,
        toDate: MONDAY,
        now: NOW,
      }),
    ).toEqual([]);
  });
});
