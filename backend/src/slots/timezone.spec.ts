import { describe, expect, it } from 'vitest';
import { utcToZonedMinutes, zonedMinutesToUtc } from './timezone.js';

const ZONE = 'Europe/Zurich';

/** 09:00 local as minutes from midnight. */
const NINE_AM = 9 * 60;

describe('zonedMinutesToUtc (Europe/Zurich)', () => {
  it('uses the winter offset (+1) outside DST', () => {
    const utc = zonedMinutesToUtc('2026-01-15', NINE_AM, ZONE);
    expect(utc.getUTCHours()).toBe(8); // 09:00 CET → 08:00 UTC
  });

  it('uses the summer offset (+2) during DST', () => {
    const utc = zonedMinutesToUtc('2026-07-01', NINE_AM, ZONE);
    expect(utc.getUTCHours()).toBe(7); // 09:00 CEST → 07:00 UTC
  });

  it('picks the summer offset after the spring-forward transition', () => {
    // 2026-03-29: clocks jump 02:00 → 03:00; by 09:00 it is CEST (+2).
    const utc = zonedMinutesToUtc('2026-03-29', NINE_AM, ZONE);
    expect(utc.getUTCHours()).toBe(7);
  });

  it('picks the winter offset after the fall-back transition', () => {
    // 2026-10-25: clocks fall 03:00 → 02:00; by 09:00 it is CET (+1).
    const utc = zonedMinutesToUtc('2026-10-25', NINE_AM, ZONE);
    expect(utc.getUTCHours()).toBe(8);
  });

  it('throws on a wall-clock time that does not exist (spring gap)', () => {
    // 02:30 on 2026-03-29 is skipped by the spring-forward.
    expect(() => zonedMinutesToUtc('2026-03-29', 150, ZONE)).toThrow();
  });
});

describe('utcToZonedMinutes (Europe/Zurich)', () => {
  it('round-trips a normal wall-clock time on a DST day', () => {
    const utc = zonedMinutesToUtc('2026-10-25', NINE_AM, ZONE);
    expect(utcToZonedMinutes(utc, ZONE)).toBe(NINE_AM);
  });

  it('resolves the fall-back ambiguous hour deterministically', () => {
    // 02:30 on 2026-10-25 occurs twice; Luxon picks the pre-transition offset.
    // Whichever it picks, the wall-clock minutes must round-trip to 02:30.
    const utc = zonedMinutesToUtc('2026-10-25', 150, ZONE);
    expect(utcToZonedMinutes(utc, ZONE)).toBe(150);
  });
});
