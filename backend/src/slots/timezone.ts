import { DateTime } from 'luxon';

/**
 * Converts a wall-clock time — a local date plus minutes from local midnight — in
 * the given IANA zone to the corresponding UTC instant, honouring DST. Throws if
 * that wall-clock time does not exist (e.g. during the spring-forward gap).
 */
export function zonedMinutesToUtc(
  localDate: string,
  minutes: number,
  zone: string,
): Date {
  const [year, month, day] = localDate.split('-').map(Number);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const dt = DateTime.fromObject({ year, month, day, hour, minute }, { zone });
  if (!dt.isValid) {
    throw new Error(
      `Invalid wall-clock time ${localDate} +${minutes}min in ${zone}: ${dt.invalidReason}`,
    );
  }
  // During the autumn fall-back a wall-clock time occurs twice; Luxon
  // deterministically resolves it to the pre-transition offset, which is fine
  // here (such times are outside opening hours anyway).
  //
  // Luxon silently shifts a non-existent local time (the spring-forward gap)
  // forward instead of flagging it; detect that by comparing back the wall clock.
  if (dt.hour !== hour || dt.minute !== minute) {
    throw new Error(
      `Wall-clock time ${localDate} ${hour}:${minute} does not exist in ${zone} (DST gap)`,
    );
  }
  return dt.toUTC().toJSDate();
}

/**
 * The wall-clock minutes from local midnight that a UTC instant falls on, in the
 * given zone. Used to map an existing appointment/block onto a day's minute grid.
 */
export function utcToZonedMinutes(instant: Date, zone: string): number {
  const dt = DateTime.fromJSDate(instant, { zone });
  return dt.hour * 60 + dt.minute;
}
