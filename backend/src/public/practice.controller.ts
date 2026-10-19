import { Controller, Get } from '@nestjs/common';
import {
  type Branding,
  type Contact,
  type Legal,
  practiceConfig,
} from '@praxis-buchung/config';

/**
 * The public (unauthenticated) view of the practice: presentation data only.
 * Deliberately a subset of the config — the `seed` section (team, services,
 * hours) is operational data that belongs to the database and is exposed through
 * its own endpoints, never leaked here.
 */
export interface PublicPractice {
  branding: Branding;
  contact: Contact;
  legal: Legal;
  /** IANA timezone the practice runs in; the UI formats slot times in it. */
  timezone: string;
}

/**
 * GET /api/public/practice — serves branding, contact and legal from the practice
 * config (see ADR-0001/ADR-0004: branding lives in the config, not the DB). The
 * public website reads this to theme itself and render the contact/legal pages.
 */
@Controller('api/public')
export class PublicPracticeController {
  @Get('practice')
  getPractice(): PublicPractice {
    const { branding, contact, legal, timezone } = practiceConfig;
    return { branding, contact, legal, timezone };
  }
}
