import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { isActive } from './active-range.js';

/** A bookable service as shown on the public services page. */
export interface PublicService {
  id: string;
  name: string;
  durationMin: number;
  descriptionDe: string | null;
  descriptionEn: string | null;
}

/** A credential shown under a team member. */
export interface PublicQualification {
  nameDe: string;
  nameEn: string;
}

/** An active team member as shown on the public team page. */
export interface PublicTeamMember {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  roleDe: string | null;
  roleEn: string | null;
  photoUrl: string | null;
  qualifications: PublicQualification[];
}

/**
 * Public, read-only content served from the database (the source of truth for
 * operational data, per ADR-0001). Both language variants are returned; the
 * frontend picks one by the current UI language, so switching needs no refetch.
 */
@Controller('api/public')
export class PublicContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('services')
  async getServices(): Promise<PublicService[]> {
    const services = await this.prisma.service.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return services.map((service) => ({
      id: service.id,
      name: service.name,
      durationMin: service.durationMin,
      descriptionDe: service.descriptionDe,
      descriptionEn: service.descriptionEn,
    }));
  }

  @Get('team')
  async getTeam(): Promise<PublicTeamMember[]> {
    const now = new Date();
    const therapists = await this.prisma.therapist.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: { qualifications: { include: { qualification: true } } },
    });
    // Only therapists whose Active range covers now are shown publicly. Filtering
    // in JS (reusing the tested isActive predicate) is deliberate for a
    // single-practice dataset; at scale this would move into a Prisma `where`.
    return therapists
      .filter((therapist) => isActive(therapist, now))
      .map((therapist) => ({
        id: therapist.id,
        firstName: therapist.firstName,
        lastName: therapist.lastName,
        title: therapist.title,
        roleDe: therapist.roleDe,
        roleEn: therapist.roleEn,
        photoUrl: therapist.photoUrl,
        qualifications: therapist.qualifications
          .map((tq) => ({
            nameDe: tq.qualification.nameDe,
            nameEn: tq.qualification.nameEn,
          }))
          .sort((a, b) => a.nameDe.localeCompare(b.nameDe)),
      }));
  }
}
