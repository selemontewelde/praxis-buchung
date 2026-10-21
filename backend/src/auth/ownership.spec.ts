import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { AuthenticatedAdmin } from './auth.service.js';
import {
  assertCanActOnTherapist,
  effectiveTherapistFilter,
  restrictToOwnTherapist,
} from './ownership.js';

const admin: AuthenticatedAdmin = {
  id: 'u1',
  email: 'admin@example.com',
  role: 'ADMIN',
  therapistId: null,
};
const anna: AuthenticatedAdmin = {
  id: 'u2',
  email: 'anna@example.com',
  role: 'THERAPIST',
  therapistId: 'anna',
};

describe('assertCanActOnTherapist', () => {
  it('lets an ADMIN act on any therapist', () => {
    expect(() => assertCanActOnTherapist(admin, 'anna')).not.toThrow();
    expect(() => assertCanActOnTherapist(admin, 'ben')).not.toThrow();
  });

  it('lets a THERAPIST act on their own therapist', () => {
    expect(() => assertCanActOnTherapist(anna, 'anna')).not.toThrow();
  });

  it('forbids a THERAPIST acting on another therapist', () => {
    expect(() => assertCanActOnTherapist(anna, 'ben')).toThrow(
      ForbiddenException,
    );
  });
});

describe('effectiveTherapistFilter', () => {
  it('keeps the requested filter for an ADMIN (including undefined = all)', () => {
    expect(effectiveTherapistFilter(admin, 'ben')).toBe('ben');
    expect(effectiveTherapistFilter(admin, undefined)).toBeUndefined();
  });

  it('pins a THERAPIST to their own therapist, ignoring the request', () => {
    expect(effectiveTherapistFilter(anna, undefined)).toBe('anna');
    expect(effectiveTherapistFilter(anna, 'ben')).toBe('anna');
  });

  it('fails closed for a THERAPIST with no linked therapist (no unrestricted scope)', () => {
    const broken: AuthenticatedAdmin = { ...anna, therapistId: null };
    expect(() => effectiveTherapistFilter(broken, undefined)).toThrow(
      ForbiddenException,
    );
  });
});

describe('restrictToOwnTherapist', () => {
  it('does not restrict an ADMIN', () => {
    expect(restrictToOwnTherapist(admin)).toBeUndefined();
  });

  it('restricts a THERAPIST to their own therapist', () => {
    expect(restrictToOwnTherapist(anna)).toBe('anna');
  });

  it('fails closed for a THERAPIST with no linked therapist', () => {
    const broken: AuthenticatedAdmin = { ...anna, therapistId: null };
    expect(() => restrictToOwnTherapist(broken)).toThrow(ForbiddenException);
  });
});
