import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateBlockDto } from './dto/block.dto.js';

export interface AdminBlockView {
  id: string;
  therapistId: string;
  therapistName: string;
  reason: string;
  startAt: string;
  endAt: string;
  note: string | null;
}

/** Admin management of therapist blocks (absences). Blocks are deletable. */
@Injectable()
export class AdminBlockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upcoming and ongoing blocks (end in the future), soonest first. A therapist
   * filter restricts the list to one therapist (used to scope a THERAPIST user to
   * their own); undefined returns all.
   */
  async list(
    filterTherapistId?: string,
    now = new Date(),
  ): Promise<AdminBlockView[]> {
    const blocks = await this.prisma.block.findMany({
      where: {
        endAt: { gt: now },
        ...(filterTherapistId !== undefined
          ? { therapistId: filterTherapistId }
          : {}),
      },
      include: { therapist: true },
      orderBy: { startAt: 'asc' },
    });
    return blocks.map((b) => ({
      id: b.id,
      therapistId: b.therapistId,
      therapistName: `${b.therapist.firstName} ${b.therapist.lastName}`,
      reason: b.reason,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      note: b.note,
    }));
  }

  async create(dto: CreateBlockDto): Promise<{ id: string }> {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (startAt.getTime() >= endAt.getTime()) {
      throw new BadRequestException('startAt must be before endAt');
    }
    const therapist = await this.prisma.therapist.findUnique({
      where: { id: dto.therapistId },
    });
    if (therapist === null) {
      throw new NotFoundException(`Unknown therapist: ${dto.therapistId}`);
    }
    const block = await this.prisma.block.create({
      data: {
        therapistId: dto.therapistId,
        reason: dto.reason,
        startAt,
        endAt,
        note: dto.note ?? null,
      },
    });
    return { id: block.id };
  }

  /**
   * Delete a block. When `restrictToTherapistId` is set (a THERAPIST user), only
   * their own block is deletable; another's is reported as not found, which also
   * avoids revealing that it exists.
   */
  async remove(id: string, restrictToTherapistId?: string): Promise<void> {
    const { count } = await this.prisma.block.deleteMany({
      where: {
        id,
        ...(restrictToTherapistId !== undefined
          ? { therapistId: restrictToTherapistId }
          : {}),
      },
    });
    if (count === 0) {
      throw new NotFoundException(`Unknown block: ${id}`);
    }
  }
}
