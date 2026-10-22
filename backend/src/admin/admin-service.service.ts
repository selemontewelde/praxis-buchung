import { Injectable, NotFoundException } from '@nestjs/common';
import type { LocalizedText } from '@praxis-buchung/config';
import { asLocalizedText, toJsonInput } from '../common/localized-text.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateServiceDto,
  UpdateServiceDto,
} from './dto/service.dto.js';

export interface AdminServiceView {
  id: string;
  name: string;
  durationMin: number;
  description: LocalizedText | null;
  active: boolean;
}

/** Admin CRUD for the service catalogue. "Remove" archives (active=false). */
@Injectable()
export class AdminServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AdminServiceView[]> {
    const services = await this.prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    return services.map((s) => ({
      id: s.id,
      name: s.name,
      durationMin: s.durationMin,
      description: asLocalizedText(s.description),
      active: s.active,
    }));
  }

  async create(dto: CreateServiceDto): Promise<{ id: string }> {
    const service = await this.prisma.service.create({
      data: {
        name: dto.name,
        durationMin: dto.durationMin,
        ...(dto.description !== undefined
          ? { description: toJsonInput(dto.description) }
          : {}),
      },
    });
    return { id: service.id };
  }

  async update(id: string, dto: UpdateServiceDto): Promise<void> {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (existing === null) {
      throw new NotFoundException(`Unknown service: ${id}`);
    }
    await this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.durationMin !== undefined
          ? { durationMin: dto.durationMin }
          : {}),
        // When provided, the localized description replaces the stored map as a
        // whole (de + en are required by the DTO, so it always stays valid).
        ...(dto.description !== undefined
          ? { description: toJsonInput(dto.description) }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }
}
