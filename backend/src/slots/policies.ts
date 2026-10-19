import type { Interval } from './slot-engine.js';

/**
 * Expands every busy interval by `bufferMin` on both sides, so the slot engine
 * leaves at least that much free time around each existing appointment (time to
 * reset the room, write notes, etc.).
 */
export function applyBuffer(busy: Interval[], bufferMin: number): Interval[] {
  if (bufferMin === 0) {
    return busy;
  }
  return busy.map((interval) => ({
    startMin: interval.startMin - bufferMin,
    endMin: interval.endMin + bufferMin,
  }));
}

/**
 * Whether a slot's start instant falls inside the bookable window: not sooner
 * than the minimum lead time from now, and not past the booking horizon.
 */
export function withinBookingWindow(
  slotStart: Date,
  now: Date,
  minLeadMinutes: number,
  horizonDays: number,
): boolean {
  const earliest = now.getTime() + minLeadMinutes * 60_000;
  const latest = now.getTime() + horizonDays * 24 * 60 * 60_000;
  const t = slotStart.getTime();
  return t >= earliest && t <= latest;
}
