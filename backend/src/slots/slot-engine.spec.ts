import { describe, expect, it } from 'vitest';
import { type ComputeSlotsInput, computeSlots } from './slot-engine.js';

/** A full-availability base case; each test overrides only what it exercises. */
function input(over: Partial<ComputeSlotsInput> = {}): ComputeSlotsInput {
  return {
    openingWindows: [{ startMin: 480, endMin: 600 }], // 08:00–10:00
    workingWindows: [{ startMin: 480, endMin: 600 }],
    busyIntervals: [],
    gridMin: 30,
    durationMin: 30,
    ...over,
  };
}

describe('computeSlots', () => {
  it('places slot starts on the grid anchored to midnight', () => {
    // 08:00–10:00, 30-min grid, 30-min duration → 08:00, 08:30, 09:00, 09:30.
    expect(computeSlots(input())).toEqual([480, 510, 540, 570]);
  });

  it('clamps working hours to the opening hours (intersection)', () => {
    // Works 08:00–10:00 but the practice opens only 09:00–10:00 → 09:00, 09:30.
    expect(
      computeSlots(
        input({
          workingWindows: [{ startMin: 480, endMin: 600 }],
          openingWindows: [{ startMin: 540, endMin: 600 }],
        }),
      ),
    ).toEqual([540, 570]);
  });

  it('removes slots that overlap a busy interval', () => {
    // Busy 08:30–09:00 knocks out the 08:30 slot; neighbours survive.
    expect(
      computeSlots(input({ busyIntervals: [{ startMin: 510, endMin: 540 }] })),
    ).toEqual([480, 540, 570]);
  });

  it('removes a slot whose duration reaches into a busy interval', () => {
    // 60-min service at 08:00 runs 08:00–09:00 and overlaps busy 08:30–08:45.
    expect(
      computeSlots(
        input({
          durationMin: 60,
          busyIntervals: [{ startMin: 510, endMin: 525 }],
        }),
      ),
    ).toEqual([540]); // 08:00 removed (overlap), 09:00 fits 09:00–10:00
  });

  it('pushes the first slot to the next grid point inside the window', () => {
    // Window 08:20–10:00: grid is anchored to midnight, so the first fit is 08:30.
    expect(
      computeSlots(
        input({
          openingWindows: [{ startMin: 500, endMin: 600 }],
          workingWindows: [{ startMin: 500, endMin: 600 }],
        }),
      ),
    ).toEqual([510, 540, 570]);
  });

  it('respects the service duration near the window end', () => {
    // 45-min service in 08:00–10:00: the last fitting start is 09:00 (ends 09:45).
    expect(computeSlots(input({ durationMin: 45 }))).toEqual([480, 510, 540]);
  });

  it('handles multiple windows (morning and afternoon)', () => {
    const windows = [
      { startMin: 480, endMin: 540 }, // 08:00–09:00
      { startMin: 780, endMin: 840 }, // 13:00–14:00
    ];
    expect(
      computeSlots({
        openingWindows: windows,
        workingWindows: windows,
        busyIntervals: [],
        gridMin: 30,
        durationMin: 30,
      }),
    ).toEqual([480, 510, 780, 810]);
  });

  it('returns no slots when opening and working hours do not overlap', () => {
    expect(
      computeSlots(
        input({
          workingWindows: [{ startMin: 480, endMin: 540 }],
          openingWindows: [{ startMin: 600, endMin: 660 }],
        }),
      ),
    ).toEqual([]);
  });

  it('returns sorted, unique starts across overlapping/unordered windows', () => {
    // Two overlapping opening windows (listed out of order) over one working day.
    // The overlap region must not yield duplicate or out-of-order starts.
    expect(
      computeSlots({
        openingWindows: [
          { startMin: 540, endMin: 660 }, // 09:00–11:00
          { startMin: 480, endMin: 600 }, // 08:00–10:00
        ],
        workingWindows: [{ startMin: 480, endMin: 660 }],
        busyIntervals: [],
        gridMin: 30,
        durationMin: 30,
      }),
    ).toEqual([480, 510, 540, 570, 600, 630]);
  });

  it('throws on a non-positive grid', () => {
    expect(() => computeSlots(input({ gridMin: 0 }))).toThrow();
  });

  it('returns no slots when the window is shorter than the duration', () => {
    expect(
      computeSlots(
        input({
          openingWindows: [{ startMin: 480, endMin: 500 }],
          workingWindows: [{ startMin: 480, endMin: 500 }],
        }),
      ),
    ).toEqual([]);
  });
});
