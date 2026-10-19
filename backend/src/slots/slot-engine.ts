/** A half-open time interval in minutes from local midnight: [startMin, endMin). */
export interface Interval {
  startMin: number;
  endMin: number;
}

export interface ComputeSlotsInput {
  /** The practice's opening windows for the day. */
  openingWindows: Interval[];
  /** The therapist's working windows for the day. */
  workingWindows: Interval[];
  /** Already-busy intervals (appointments, blocks) mapped to minutes of the day. */
  busyIntervals: Interval[];
  /** Grid step between candidate starts, in minutes (anchored to midnight). */
  gridMin: number;
  /** Service duration in minutes. */
  durationMin: number;
}

/** The overlap of two half-open intervals, or null when they don't overlap. */
function intersect(a: Interval, b: Interval): Interval | null {
  const startMin = Math.max(a.startMin, b.startMin);
  const endMin = Math.min(a.endMin, b.endMin);
  return startMin < endMin ? { startMin, endMin } : null;
}

export function computeSlots(input: ComputeSlotsInput): number[] {
  const { openingWindows, workingWindows, busyIntervals, gridMin, durationMin } =
    input;

  if (gridMin <= 0) {
    throw new Error(`gridMin must be positive, got ${gridMin}`);
  }

  // A therapist is only available where their working hours fall inside the
  // practice's opening hours.
  const availableWindows: Interval[] = [];
  for (const working of workingWindows) {
    for (const opening of openingWindows) {
      const overlap = intersect(working, opening);
      if (overlap !== null) {
        availableWindows.push(overlap);
      }
    }
  }

  const starts = new Set<number>();
  for (const window of availableWindows) {
    // Anchor the grid to midnight: first candidate is the earliest grid point
    // at or after the window start.
    const first = Math.ceil(window.startMin / gridMin) * gridMin;
    for (let t = first; t + durationMin <= window.endMin; t += gridMin) {
      const slot: Interval = { startMin: t, endMin: t + durationMin };
      const blocked = busyIntervals.some((busy) => intersect(slot, busy) !== null);
      if (!blocked) {
        starts.add(t);
      }
    }
  }
  // Overlapping windows can propose the same start; return sorted, unique starts.
  return [...starts].sort((a, b) => a - b);
}

