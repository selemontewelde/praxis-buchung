/**
 * The shape of a practice configuration.
 *
 * This is the single file a new practice customises (see ../README). It has two
 * distinct parts, matching ADR-0001:
 *
 *   - `branding`, `contact`, `legal` — presentation data, read at runtime to
 *     render the public website (wired up in milestone 3).
 *   - `seed` — the initial operational data (team, services, capabilities,
 *     hours) written into the database once by `backend/prisma/seed.ts`. After
 *     seeding, the database is the source of truth and everything here is edited
 *     in the admin, never by changing this file.
 *
 * Entities in `seed` are referenced by a human-readable `key` (e.g. "anna",
 * "manual-therapy"); the seed uses those keys as stable database ids, which makes
 * re-seeding idempotent.
 */

export interface PracticeConfig {
  branding: Branding;
  contact: Contact;
  legal: Legal;
  /**
   * IANA timezone the practice operates in (e.g. "Europe/Zurich"). Opening and
   * working hours are wall-clock times in this zone; the slot calculation
   * (milestone 4) uses it to turn them into UTC instants with correct DST.
   */
  timezone: string;
  booking: Booking;
  seed: SeedData;
}

/** Practice-wide booking policy that shapes which slots are offered. */
export interface Booking {
  /** Step between candidate slot starts, in minutes (e.g. 15). */
  gridMin: number;
  /** Minimum free time required around an appointment, in minutes. */
  bufferMin: number;
  /** Earliest a slot may be booked, as minutes from now (lead time). */
  minLeadMinutes: number;
  /** How far into the future bookings are offered, in days. */
  horizonDays: number;
  /** Patients may cancel until this many hours before the appointment start. */
  cancellationDeadlineHours: number;
  /** A reminder email is sent this many hours before the appointment start. */
  reminderHoursBefore: number;
}

export interface Branding {
  /** Public practice name, shown in the header and page title. */
  name: string;
  /** Optional one-line tagline under the name. */
  tagline?: string;
  /** Path to the logo, relative to the frontend's served assets. */
  logoPath: string;
  colors: {
    /** Primary brand colour as a CSS hex value, e.g. "#0f766e". */
    primary: string;
    /** Accent colour as a CSS hex value. */
    accent: string;
  };
}

export interface Contact {
  street: string;
  /** Swiss postal code (4 digits). */
  postalCode: string;
  city: string;
  phone: string;
  email: string;
}

export interface Legal {
  /** Legal owner / responsible entity, shown in the Impressum. */
  owner: string;
  /** Version tag of the privacy policy patients consent to (revDSG). */
  privacyPolicyVersion: string;
}

/** Weekday names, mirroring the Prisma `Weekday` enum (mapped in the seed). */
export type ConfigWeekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/** A recurring weekly time window in local wall-clock minutes from midnight. */
export interface TimeWindow {
  weekday: ConfigWeekday;
  /** Start as minutes from local midnight (0–1440). */
  startMin: number;
  /** End as minutes from local midnight (0–1440), must be after `startMin`. */
  endMin: number;
}

export interface SeedTherapist {
  /** Stable key, used as the therapist's database id. */
  key: string;
  firstName: string;
  lastName: string;
  /** Optional professional/academic title. */
  title?: string;
  /** Role shown on the public team page, e.g. "Inhaberin & Physiotherapeutin". */
  roleDe: string;
  roleEn: string;
  /** Path to the portrait, relative to the frontend's served assets. */
  photoUrl: string;
  /** Start of the Active range as an ISO date string (stored UTC). */
  activeFrom: string;
  /**
   * Qualifications this therapist holds, by key. Descriptive only (shown on the
   * team page) — they do not affect which services the therapist can deliver.
   */
  qualifications?: string[];
}

/** A named credential/training shown on the public team page. */
export interface SeedQualification {
  /** Stable key, used as the qualification's database id. */
  key: string;
  nameDe: string;
  nameEn: string;
}

export interface SeedService {
  /** Stable key, used as the service's database id. */
  key: string;
  name: string;
  /** Fixed treatment duration in minutes. */
  durationMin: number;
  /** Public description, shown on the services page. */
  descriptionDe: string;
  descriptionEn: string;
  /**
   * Optional room/equipment (by key) this service requires. When set, a slot is
   * only offered when that room is free as well as the therapist, and the room
   * cannot be double-booked across therapists.
   */
  room?: string;
}

/** A bookable room or piece of equipment the practice offers. */
export interface SeedRoom {
  /** Stable key, used as the room's database id. */
  key: string;
  name: string;
}

/** A therapist (by key) is able to deliver a service (by key). */
export interface SeedCapability {
  therapist: string;
  service: string;
}

/** A therapist's recurring availability window (therapist referenced by key). */
export interface SeedWorkingHours extends TimeWindow {
  therapist: string;
}

/** A role a back-office login can hold. */
export type SeedUserRole = 'ADMIN' | 'THERAPIST';

/**
 * A back-office login. Passwords are local dev credentials only. An ADMIN manages
 * everything; a THERAPIST references the therapist (by key) whose own hours,
 * blocks and appointments they may manage.
 */
export interface SeedUser {
  email: string;
  password: string;
  role: SeedUserRole;
  /** Required for a THERAPIST (the therapist key); omit for an ADMIN. */
  therapist?: string;
}

export interface SeedData {
  therapists: SeedTherapist[];
  services: SeedService[];
  /** Bookable rooms/equipment; a service may require one (SeedService.room). */
  rooms: SeedRoom[];
  /** Credentials shown on the team page; therapists reference them by key. */
  qualifications: SeedQualification[];
  capabilities: SeedCapability[];
  /** Back-office logins (at least one ADMIN). */
  users: SeedUser[];
  /** The practice's weekly opening windows (outer boundary for all slots). */
  openingHours: TimeWindow[];
  /** Each therapist's weekly working windows, inside the opening hours. */
  workingHours: SeedWorkingHours[];
}
