import { describe, expect, it } from 'vitest';
import {
  type PracticeConfig,
  PracticeConfigError,
  practiceConfig,
  type SeedData,
  validatePracticeConfig,
} from '@praxis-buchung/config';

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
    booking: {
      gridMin: 15,
      bufferMin: 10,
      minLeadMinutes: 120,
      horizonDays: 60,
      cancellationDeadlineHours: 24,
      reminderHoursBefore: 24,
    },
    seed,
  };
}

const validSeed: SeedData = {
  therapists: [
    {
      key: 'anna',
      firstName: 'Anna',
      lastName: 'Keller',
      role: { de: 'Physiotherapeutin', en: 'Physiotherapist' },
      photoUrl: 'assets/team/anna.svg',
      activeFrom: '2024-01-01',
    },
  ],
  services: [
    {
      key: 'physio',
      name: 'Physiotherapie',
      durationMin: 30,
      description: { de: 'Beschreibung', en: 'Description' },
    },
  ],
  rooms: [],
  qualifications: [],
  capabilities: [{ therapist: 'anna', service: 'physio' }],
  users: [{ email: 'admin@example.com', password: 'dev-only', role: 'ADMIN' }],
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

  it('rejects a non-positive booking grid', () => {
    const config = makeConfig(validSeed);
    config.booking.gridMin = 0;
    expect(() => validatePracticeConfig(config)).toThrow(/gridMin/);
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

  it('rejects duplicate room keys', () => {
    const seed: SeedData = {
      ...validSeed,
      rooms: [
        { key: 'room-a', name: 'Room A' },
        { key: 'room-a', name: 'Room A (dup)' },
      ],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(/room-a/);
  });

  it('rejects duplicate qualification keys', () => {
    const seed: SeedData = {
      ...validSeed,
      qualifications: [
        { key: 'mt', name: { de: 'Manuelle Therapie', en: 'Manual therapy' } },
        { key: 'mt', name: { de: 'Duplikat', en: 'Duplicate' } },
      ],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(/mt/);
  });

  it('rejects duplicate user emails', () => {
    const seed: SeedData = {
      ...validSeed,
      users: [
        { email: 'a@example.com', password: 'x', role: 'ADMIN' },
        { email: 'a@example.com', password: 'y', role: 'ADMIN' },
      ],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(
      /a@example.com/,
    );
  });

  it('requires at least one ADMIN user', () => {
    const seed: SeedData = {
      ...validSeed,
      users: [
        { email: 'anna@example.com', password: 'x', role: 'THERAPIST', therapist: 'anna' },
      ],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(/ADMIN/);
  });

  it('rejects a THERAPIST user referencing an unknown therapist', () => {
    const seed: SeedData = {
      ...validSeed,
      users: [
        ...validSeed.users,
        { email: 'x@example.com', password: 'x', role: 'THERAPIST', therapist: 'ghost' },
      ],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(/ghost/);
  });

  it('rejects two logins for the same therapist', () => {
    const seed: SeedData = {
      ...validSeed,
      users: [
        ...validSeed.users,
        { email: 'anna1@example.com', password: 'x', role: 'THERAPIST', therapist: 'anna' },
        { email: 'anna2@example.com', password: 'x', role: 'THERAPIST', therapist: 'anna' },
      ],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(
      /more than one login/,
    );
  });

  it('accepts an ADMIN plus a THERAPIST login for a known therapist', () => {
    const seed: SeedData = {
      ...validSeed,
      users: [
        { email: 'admin@example.com', password: 'x', role: 'ADMIN' },
        { email: 'anna@example.com', password: 'x', role: 'THERAPIST', therapist: 'anna' },
      ],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).not.toThrow();
  });

  it('rejects a therapist referencing an unknown qualification', () => {
    const seed: SeedData = {
      ...validSeed,
      therapists: [{ ...validSeed.therapists[0], qualifications: ['ghost-qual'] }],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(/ghost-qual/);
  });

  it('accepts a therapist referencing a declared qualification', () => {
    const seed: SeedData = {
      ...validSeed,
      qualifications: [
        { key: 'mt', name: { de: 'Manuelle Therapie', en: 'Manual therapy' } },
      ],
      therapists: [{ ...validSeed.therapists[0], qualifications: ['mt'] }],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).not.toThrow();
  });

  it('rejects a service referencing an unknown room', () => {
    const seed: SeedData = {
      ...validSeed,
      services: [{ ...validSeed.services[0], room: 'ghost-room' }],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).toThrow(/ghost-room/);
  });

  it('accepts a service that references a declared room', () => {
    const seed: SeedData = {
      ...validSeed,
      rooms: [{ key: 'room-a', name: 'Room A' }],
      services: [{ ...validSeed.services[0], room: 'room-a' }],
    };
    expect(() => validatePracticeConfig(makeConfig(seed))).not.toThrow();
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
