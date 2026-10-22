import { Controller, Get } from '@nestjs/common';
import type { LocalizedText } from '@praxis-buchung/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { asLocalizedText } from '../common/localized-text.js';
import { isActive } from './active-range.js';

/** A bookable service as shown on the public services page. */
export interface PublicService {
  id: string;
  name: string;
  durationMin: number;
  description: LocalizedText | null;
}

/** A credential shown under a team member. */
export interface PublicQualification {
  name: LocalizedText | null;
}

/** An active team member as shown on the public team page. */
export interface PublicTeamMember {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  role: LocalizedText | null;
  photoUrl: string | null;
  qualifications: PublicQualification[];
}

/**
 * Public, read-only content served from the database (the source of truth for
 * operational data, per ADR-0001). Localized text is returned as a per-locale map
 * (ADR-0015); the frontend's `pick()` resolves the active UI language with a
 * fallback chain, so switching language needs no refetch.
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
      description: asLocalizedText(service.description),
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
        role: asLocalizedText(therapist.role),
        photoUrl: therapist.photoUrl,
        qualifications: therapist.qualifications
          .map((tq) => ({ name: asLocalizedText(tq.qualification.name) }))
          .sort((a, b) => (a.name?.de ?? '').localeCompare(b.name?.de ?? '')),
      }));
  }
}
