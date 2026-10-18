import { describe, expect, it } from 'vitest';
import type {
  PracticeConfig,
  SeedData,
} from '../../../config/practice-config.types.js';
import { practiceConfig } from '../../../config/practice.config.js';
import {
  PracticeConfigError,
  validatePracticeConfig,
} from '../../../config/practice-config.validation.js';

/** A minimal, internally consistent config; tests mutate `seed` per case. */
function makeConfig(seed: SeedData): PracticeConfig {
  return {
    branding: {
      name: 'Test',
      logoPath: 'assets/logo.svg',
      colors: { primary: '#000000', accent: '#ffffff' },
    },
    contact: {
      street: 'Teststrasse 1',
      postalCode: '5000',
      city: 'Aarau',
      phone: '+41 00 000 00 00',
      email: 'test@example.com',
    },
    legal: { owner: 'Test GmbH', privacyPolicyVersion: '2025-01' },
    timezone: 'Europe/Zurich',
    seed,
  };
}

const validSeed: SeedData = {
  therapists: [
    { key: 'anna', firstName: 'Anna', lastName: 'Keller', activeFrom: '2024-01-01' },
  ],
  services: [{ key: 'physio', name: 'Physiotherapie', durationMin: 30 }],
  capabilities: [{ therapist: 'anna', service: 'physio' }],
  openingHours: [{ weekday: 'MONDAY', startMin: 480, endMin: 720 }],
  workingHours: [
    { therapist: 'anna', weekday: 'MONDAY', startMin: 480, endMin: 720 },
  ],
};

describe('validatePracticeConfig', () => {
  it('accepts a consistent config', () => {
    expect(() => validatePracticeConfig(makeConfig(validSeed))).not.toThrow();
  });

  it('accepts the shipped demo config', () => {
    expect(() => validatePracticeConfig(practiceConfig)).not.toThrow();
  });

  it('rejects an invalid timezone', () => {
    const config = { ...makeConfig(validSeed), timezone: 'Mars/Olympus' };
    expect(() => validatePracticeConfig(config)).toThrow(/timezone/);
  });

  it('rejects duplicate therapist keys', () => {
    const seed: SeedData = {
      ...validSeed,
      therapists: [...validSeed.therapists, ...validSeed.therapists],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(
      PracticeConfigError,
    );
  });

  it('rejects a capability referencing an unknown service', () => {
    const seed: SeedData = {
      ...validSeed,
      capabilities: [{ therapist: 'anna', service: 'ghost' }],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(/ghost/);
  });

  it('rejects a capability referencing an unknown therapist', () => {
    const seed: SeedData = {
      ...validSeed,
      capabilities: [{ therapist: 'ghost', service: 'physio' }],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(/ghost/);
  });

  it('rejects working hours for an unknown therapist', () => {
    const seed: SeedData = {
      ...validSeed,
      workingHours: [
        { therapist: 'ghost', weekday: 'MONDAY', startMin: 480, endMin: 720 },
      ],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(/ghost/);
  });

  it('rejects a time window where end is not after start', () => {
    const seed: SeedData = {
      ...validSeed,
      openingHours: [{ weekday: 'MONDAY', startMin: 720, endMin: 720 }],
      workingHours: [],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(
      PracticeConfigError,
    );
  });

  it('rejects a time window outside 0–1440', () => {
    const seed: SeedData = {
      ...validSeed,
      openingHours: [{ weekday: 'MONDAY', startMin: -10, endMin: 720 }],
      workingHours: [],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(
      PracticeConfigError,
    );
  });

  it('rejects working hours outside the opening hours of that weekday', () => {
    const seed: SeedData = {
      ...validSeed,
      // Opening Mon 08:00–12:00, but Anna works until 13:00 → out of bounds.
      workingHours: [
        { therapist: 'anna', weekday: 'MONDAY', startMin: 480, endMin: 780 },
      ],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(
      PracticeConfigError,
    );
  });

  it('rejects working hours on a weekday the practice is closed', () => {
    const seed: SeedData = {
      ...validSeed,
      workingHours: [
        { therapist: 'anna', weekday: 'SUNDAY', startMin: 480, endMin: 720 },
      ],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(
      PracticeConfigError,
    );
  });

  it('collects multiple problems into one error', () => {
    const seed: SeedData = {
      ...validSeed,
      capabilities: [{ therapist: 'ghost', service: 'ghost' }],
    };
    try {
      validatePracticeConfig(makeConfig(seed));
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PracticeConfigError);
      expect((error as PracticeConfigError).problems.length).toBeGreaterThan(1);
    }
  });
});
