/**
 * True if a Prisma/Postgres error means a concurrent write lost the race on an
 * appointment overlap guard. Two forms occur: a clean exclusion-constraint
 * violation (SQLSTATE 23P01, from either the therapist or the room constraint),
 * or a deadlock / serialization failure while checking those constraints under
 * contention (40P01 / 40001, surfaced by Prisma as P2034). Callers map all of
 * these to a 409 — the slot was just taken, and exactly one writer still wins.
 *
 * Shared by the public booking flow and the admin reassignment flow so the set of
 * recognised codes can't drift between them.
 */
export function isConcurrencyConflict(error: unknown): boolean {
  const code = (error as { code?: unknown }).code;
  const text = error instanceof Error ? error.message : String(error);
  return (
    code === 'P2034' || // Prisma: write conflict or deadlock, retry-able
    text.includes('appointment_no_overlap') ||
    text.includes('appointment_room_no_overlap') ||
    text.includes('23P01') || // exclusion_violation
    text.includes('40P01') || // deadlock_detected
    text.includes('40001') // serialization_failure
  );
}
