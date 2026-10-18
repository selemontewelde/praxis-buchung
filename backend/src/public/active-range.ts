/** The subset of a therapist needed to decide whether they currently take bookings. */
export interface ActiveRange {
  activeFrom: Date;
  activeUntil: Date | null;
}

/**
 * Whether a therapist is active at `now`: their Active range has started and has
 * not ended. A null `activeUntil` means open-ended (still active). This is how a
 * future-dated hire and a departed therapist are handled (ADR-0001), without ever
 * deleting the record.
 */
export function isActive(range: ActiveRange, now: Date): boolean {
  if (range.activeFrom.getTime() > now.getTime()) {
    return false;
  }
  if (range.activeUntil !== null && range.activeUntil.getTime() < now.getTime()) {
    return false;
  }
  return true;
}
