import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { LocalizedText } from '@praxis-buchung/config';
import { asLocalizedText, toJsonInput } from '../common/localized-text.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateTherapistDto,
  UpdateTherapistDto,
} from './dto/therapist.dto.js';

export interface AdminTherapistView {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  role: LocalizedText | null;
  photoUrl: string | null;
  activeFrom: string;
  activeUntil: string | null;
  capabilityServiceIds: string[];
}

/** Admin CRUD for therapists. Therapists are never deleted (ADR-0001). */
@Injectable()
export class AdminTherapistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AdminTherapistView[]> {
    const therapists = await this.prisma.therapist.findMany({
      include: { capabilities: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    return therapists.map((t) => ({
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      title: t.title,
      role: asLocalizedText(t.role),
      photoUrl: t.photoUrl,
      activeFrom: t.activeFrom.toISOString(),
      activeUntil: t.activeUntil?.toISOString() ?? null,
      capabilityServiceIds: t.capabilities.map((c) => c.serviceId),
    }));
  }

  async create(dto: CreateTherapistDto): Promise<{ id: string }> {
    const therapist = await this.prisma.therapist.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        title: dto.title ?? null,
        role: toJsonInput(dto.role),
        photoUrl: dto.photoUrl ?? null,
        activeFrom: new Date(dto.activeFrom),
        activeUntil:
          dto.activeUntil !== undefined ? new Date(dto.activeUntil) : null,
      },
    });
    return { id: therapist.id };
  }

  async update(id: string, dto: UpdateTherapistDto): Promise<void> {
    await this.ensureTherapist(id);
    await this.prisma.therapist.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.role !== undefined
          ? { role: toJsonInput(dto.role) }
          : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        ...(dto.activeFrom !== undefined
          ? { activeFrom: new Date(dto.activeFrom) }
          : {}),
        // null re-activates (open-ended); a string deactivates at that instant.
        ...(dto.activeUntil !== undefined
          ? {
              activeUntil:
                dto.activeUntil === null ? null : new Date(dto.activeUntil),
            }
          : {}),
      },
    });
  }

  /** Replace the therapist's capability set with exactly `serviceIds`. */
  async setCapabilities(id: string, serviceIds: string[]): Promise<void> {
    await this.ensureTherapist(id);
    const unique = [...new Set(serviceIds)];
    if (unique.length > 0) {
      const found = await this.prisma.service.findMany({
        where: { id: { in: unique } },
        select: { id: true },
      });
      if (found.length !== unique.length) {
        throw new BadRequestException('Unknown service in capability set');
      }
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.capability.deleteMany({ where: { therapistId: id } });
      if (unique.length > 0) {
        await tx.capability.createMany({
          data: unique.map((serviceId) => ({ therapistId: id, serviceId })),
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

