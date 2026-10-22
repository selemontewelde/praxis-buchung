import { describe, expect, it } from 'vitest';
import { userShapeProblem } from './admin-user-rules.js';

describe('userShapeProblem', () => {
  it('accepts an ADMIN without a therapist', () => {
    expect(userShapeProblem('ADMIN', null)).toBeNull();
  });

  it('accepts a THERAPIST linked to a therapist', () => {
    expect(userShapeProblem('THERAPIST', 'anna')).toBeNull();
  });

  it('rejects a THERAPIST without a therapist', () => {
    expect(userShapeProblem('THERAPIST', null)).toMatch(/therapist/i);
  });

  it('rejects an ADMIN linked to a therapist', () => {
    expect(userShapeProblem('ADMIN', 'anna')).toMatch(/admin/i);
  });
});
