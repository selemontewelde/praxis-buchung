import { describe, expect, it } from 'vitest';
import { isActive } from './active-range.js';

const now = new Date('2026-06-15T10:00:00.000Z');

describe('isActive', () => {
  it('is active when now is after activeFrom and there is no end', () => {
    expect(
      isActive({ activeFrom: new Date('2024-01-01'), activeUntil: null }, now),
    ).toBe(true);
  });

  it('is inactive before the active range starts (future hire)', () => {
    expect(
      isActive({ activeFrom: new Date('2027-01-01'), activeUntil: null }, now),
    ).toBe(false);
  });

  it('is inactive after the active range ends (departed therapist)', () => {
    expect(
      isActive(
        {
          activeFrom: new Date('2024-01-01'),
          activeUntil: new Date('2026-01-01'),
        },
        now,
      ),
    ).toBe(false);
  });

  it('is active within a bounded range', () => {
    expect(
      isActive(
        {
          activeFrom: new Date('2026-01-01'),
          activeUntil: new Date('2026-12-31'),
        },
        now,
      ),
    ).toBe(true);
  });

  it('treats the activeFrom instant itself as active', () => {
    expect(isActive({ activeFrom: now, activeUntil: null }, now)).toBe(true);
  });
});
