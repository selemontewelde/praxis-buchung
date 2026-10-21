import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedAdmin } from './auth.service.js';

/**
 * Per-therapist ownership rules for the shared admin endpoints (working hours,
 * blocks, appointments). An ADMIN may act on anyone; a THERAPIST only on their
 * own linked therapist. Pure except for the thrown exception, so the decision is
 * unit-tested directly.
 */

/**
 * The therapist a THERAPIST login is confined to. Fail-closed: a THERAPIST
 * principal without a linked therapist is rejected rather than falling through to
 * an unrestricted scope (config validation forbids it, but authorization must not
 * depend on that invariant holding).
 */
function ownTherapistId(admin: AuthenticatedAdmin): string {
  if (admin.therapistId === null) {
    throw new ForbiddenException('This login is not linked to a therapist');
  }
  return admin.therapistId;
}

/** Throw unless `admin` may act on `therapistId` (ADMIN: always; THERAPIST: own). */
export function assertCanActOnTherapist(
  admin: AuthenticatedAdmin,
  therapistId: string,
): void {
  if (admin.role === 'THERAPIST' && ownTherapistId(admin) !== therapistId) {
    throw new ForbiddenException('You may only manage your own data');
  }
}

/**
 * The therapist filter to apply to a list endpoint: a THERAPIST is always pinned
 * to their own therapist (any requested filter is ignored); an ADMIN keeps the
 * requested filter (undefined = all).
 */
export function effectiveTherapistFilter(
  admin: AuthenticatedAdmin,
  requested: string | undefined,
): string | undefined {
  return admin.role === 'THERAPIST' ? ownTherapistId(admin) : requested;
}

/**
 * The therapist restriction for an opaque-:id mutation (cancel/remove): a
 * THERAPIST is confined to their own therapist, an ADMIN is unrestricted
 * (undefined). Mirrors the list filter without a requested override.
 */
export function restrictToOwnTherapist(
  admin: AuthenticatedAdmin,
): string | undefined {
  return admin.role === 'THERAPIST' ? ownTherapistId(admin) : undefined;
}
