import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Weekday } from './dto/hours.dto.js';

export interface HoursWindow {
  weekday: Weekday;
  startMin: number;
  endMin: number;
}

function assertValidWindows(windows: HoursWindow[]): void {
  const seen = new Set<string>();
  for (const w of windows) {
    if (w.startMin >= w.endMin) {
      throw new BadRequestException(
        `window ${w.weekday} ${w.startMin}-${w.endMin} ends before it starts`,
      );
    }
    const key = `${w.weekday}:${w.startMin}:${w.endMin}`;
    if (seen.has(key)) {
      throw new BadRequestException(`duplicate window ${key}`);
    }
    seen.add(key);
  }
}

/** Admin editing of opening hours (practice-wide) and per-therapist working hours. */
@Injectable()
export class AdminHoursService {
  constructor(private readonly prisma: PrismaService) {}

  async getOpening(): Promise<HoursWindow[]> {
    const rows = await this.prisma.openingHours.findMany({
      orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }],
    });
    return rows.map((r) => ({
      weekday: r.weekday,
      startMin: r.startMin,
      endMin: r.endMin,
    }));
  }

  async setOpening(windows: HoursWindow[]): Promise<void> {
    assertValidWindows(windows);
    await this.prisma.$transaction(async (tx) => {
      await tx.openingHours.deleteMany();
      if (windows.length > 0) {
        await tx.openingHours.createMany({ data: windows });
      }
    });
  }

  async getWorking(therapistId: string): Promise<HoursWindow[]> {
    await this.ensureTherapist(therapistId);
    const rows = await this.prisma.workingHours.findMany({
      where: { therapistId },
      orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }],
    });
    return rows.map((r) => ({
      weekday: r.weekday,
      startMin: r.startMin,
      endMin: r.endMin,
    }));
  }

  async setWorking(therapistId: string, windows: HoursWindow[]): Promise<void> {
    await this.ensureTherapist(therapistId);
    assertValidWindows(windows);

    const opening = await this.getOpening();
    for (const w of windows) {
      const fits = opening.some(
        (o) =>
          o.weekday === w.weekday &&
          w.startMin >= o.startMin &&
          w.endMin <= o.endMin,
      );
      if (!fits) {
        throw new BadRequestException(
          `working hours ${w.weekday} ${w.startMin}-${w.endMin} are outside the opening hours`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workingHours.deleteMany({ where: { therapistId } });
      if (windows.length > 0) {
        await tx.workingHours.createMany({
          data: windows.map((w) => ({ therapistId, ...w })),
        });
      }
    });
  }

  private async ensureTherapist(id: string): Promise<void> {
    const therapist = await this.prisma.therapist.findUnique({ where: { id } });
    if (therapist === null) {
      throw new NotFoundException(`Unknown therapist: ${id}`);
    }
  }
}
