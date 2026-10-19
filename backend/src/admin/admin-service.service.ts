import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateServiceDto,
  UpdateServiceDto,
} from './dto/service.dto.js';

export interface AdminServiceView {
  id: string;
  name: string;
  durationMin: number;
  descriptionDe: string | null;
  descriptionEn: string | null;
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
      descriptionDe: s.descriptionDe,
      descriptionEn: s.descriptionEn,
      active: s.active,
    }));
  }

  async create(dto: CreateServiceDto): Promise<{ id: string }> {
    const service = await this.prisma.service.create({
      data: {
        name: dto.name,
        durationMin: dto.durationMin,
        descriptionDe: dto.descriptionDe ?? null,
        descriptionEn: dto.descriptionEn ?? null,
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
        // An empty string clears the description back to NULL, so edit and
        // create stay consistent (both store null for "no description").
        ...(dto.descriptionDe !== undefined
          ? { descriptionDe: dto.descriptionDe === '' ? null : dto.descriptionDe }
          : {}),
        ...(dto.descriptionEn !== undefined
          ? { descriptionEn: dto.descriptionEn === '' ? null : dto.descriptionEn }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }
}
