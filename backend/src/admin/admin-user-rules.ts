import type { Role } from '../auth/roles.decorator.js';

/**
 * Validate the shape of a back-office login independent of the database: a
 * THERAPIST must be linked to a therapist, an ADMIN must not be. Returns a
 * human-readable problem or null when the shape is valid. DB-dependent rules
 * (email uniqueness, the therapist exists and isn't already linked, keeping at
 * least one ADMIN) live in the service.
 */
export function userShapeProblem(
  role: Role,
  therapistId: string | null,
): string | null {
  if (role === 'THERAPIST' && therapistId === null) {
    return 'A therapist login must be linked to a therapist';
  }
  if (role === 'ADMIN' && therapistId !== null) {
    return 'An admin login must not be linked to a therapist';
  }
  return null;
}
