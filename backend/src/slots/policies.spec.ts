import { describe, expect, it } from 'vitest';
import { applyBuffer, withinBookingWindow } from './policies.js';

describe('applyBuffer', () => {
  it('expands each busy interval by the buffer on both sides', () => {
    expect(applyBuffer([{ startMin: 510, endMin: 540 }], 10)).toEqual([
      { startMin: 500, endMin: 550 },
    ]);
  });

  it('returns the intervals unchanged with a zero buffer', () => {
    const busy = [{ startMin: 510, endMin: 540 }];
    expect(applyBuffer(busy, 0)).toEqual(busy);
  });
});

describe('withinBookingWindow', () => {
  const now = new Date('2026-06-15T10:00:00.000Z');
  const minutes = (m: number) => new Date(now.getTime() + m * 60_000);
  const days = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60_000);

  it('rejects slots inside the minimum lead time', () => {
    expect(withinBookingWindow(minutes(60), now, 120, 60)).toBe(false);
  });

  it('accepts a slot exactly at the lead-time boundary', () => {
    expect(withinBookingWindow(minutes(120), now, 120, 60)).toBe(true);
  });

  it('accepts a slot comfortably within the horizon', () => {
    expect(withinBookingWindow(days(30), now, 120, 60)).toBe(true);
  });

  it('rejects a slot beyond the booking horizon', () => {
    expect(withinBookingWindow(days(61), now, 120, 60)).toBe(false);
  });
});
