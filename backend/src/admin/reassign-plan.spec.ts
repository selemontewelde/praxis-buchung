import { describe, expect, it } from 'vitest';
import {
  planReassignment,
  type ReassignAppointment,
  type ReassignCandidate,
} from './reassign-plan.js';

// Epoch-ms helpers for a Wednesday (2026-03-18) in the tests; absolute instants
// are all that overlap checks need. localStartMin/weekday drive the
// working-hours warning only.
const at = (h: number, m = 0): number => Date.UTC(2026, 2, 18, h, m);

function appt(over: Partial<ReassignAppointment> = {}): ReassignAppointment {
  return {
    id: 'a1',
    serviceId: 'physio',
    start: at(9),
    end: at(9, 30),
    weekday: 'WEDNESDAY',
    localStartMin: 540, // 09:00
    localEndMin: 570, //   09:30
    ...over,
  };
}

function candidate(over: Partial<ReassignCandidate> = {}): ReassignCandidate {
  return {
    therapistId: 'ben',
    capableServiceIds: ['physio'],
    activeFrom: at(0),
    activeUntil: null,
    busy: [],
    blocks: [],
    workingWindows: [{ weekday: 'WEDNESDAY', startMin: 480, endMin: 1080 }],
    ...over,
  };
}

describe('planReassignment', () => {
  it('assigns a capable, active, free candidate with no warnings', () => {
    const plan = planReassignment({
      appointments: [appt()],
      candidates: [candidate()],
    });
    expect(plan).toEqual([
      { appointmentId: 'a1', proposedTargetId: 'ben', warnings: [] },
    ]);
  });

  it('skips a candidate that lacks the capability', () => {
    const plan = planReassignment({
      appointments: [appt({ serviceId: 'mtt' })],
      candidates: [candidate({ capableServiceIds: ['physio'] })],
    });
    expect(plan[0].proposedTargetId).toBeNull();
    expect(plan[0].unassignableReason).toBe('NO_CAPABLE_CANDIDATE');
  });

  it('skips a candidate inactive at the appointment time', () => {
    const plan = planReassignment({
      appointments: [appt()],
      candidates: [candidate({ activeUntil: at(8) })], // left before 09:00
    });
    expect(plan[0].proposedTargetId).toBeNull();
    expect(plan[0].unassignableReason).toBe('NO_CAPABLE_CANDIDATE');
  });

  it('skips a candidate with an overlapping existing appointment (hard)', () => {
    const plan = planReassignment({
      appointments: [appt()],
      candidates: [candidate({ busy: [{ start: at(9, 15), end: at(10) }] })],
    });
    expect(plan[0].proposedTargetId).toBeNull();
    expect(plan[0].unassignableReason).toBe('ALL_CANDIDATES_BUSY');
  });

  it('prefers a warning-free candidate over one on vacation', () => {
    const onVacation = candidate({
      therapistId: 'ben',
      blocks: [{ start: at(8), end: at(12) }],
    });
    const free = candidate({ therapistId: 'cara' });
    const plan = planReassignment({
      appointments: [appt()],
      candidates: [onVacation, free], // vacation one first, but should be skipped
    });
    expect(plan[0]).toEqual({
      appointmentId: 'a1',
      proposedTargetId: 'cara',
      warnings: [],
    });
  });

  it('flags ON_VACATION when the only eligible candidate overlaps a block', () => {
    const plan = planReassignment({
      appointments: [appt()],
      candidates: [candidate({ blocks: [{ start: at(8), end: at(12) }] })],
    });
    expect(plan[0].proposedTargetId).toBe('ben');
    expect(plan[0].warnings).toEqual(['ON_VACATION']);
  });

  it('flags OUTSIDE_WORKING_HOURS when the appointment falls outside the windows', () => {
    const plan = planReassignment({
      appointments: [appt()], // 09:00–09:30
      candidates: [
        candidate({
          workingWindows: [
            { weekday: 'WEDNESDAY', startMin: 780, endMin: 1080 },
          ], // afternoon only
        }),
      ],
    });
    expect(plan[0].proposedTargetId).toBe('ben');
    expect(plan[0].warnings).toEqual(['OUTSIDE_WORKING_HOURS']);
  });

  it('does not assign two overlapping appointments to the same single candidate', () => {
    const plan = planReassignment({
      appointments: [
        appt({ id: 'a1', start: at(9), end: at(9, 30) }),
        appt({ id: 'a2', start: at(9, 15), end: at(9, 45) }),
      ],
      candidates: [candidate({ therapistId: 'ben' })],
    });
    expect(plan[0].proposedTargetId).toBe('ben');
    expect(plan[1].proposedTargetId).toBeNull();
    expect(plan[1].unassignableReason).toBe('ALL_CANDIDATES_BUSY');
  });

  it('splits overlapping appointments across candidates (first-fit)', () => {
    const plan = planReassignment({
      appointments: [
        appt({ id: 'a1', start: at(9), end: at(9, 30) }),
        appt({ id: 'a2', start: at(9, 15), end: at(9, 45) }),
      ],
      candidates: [
        candidate({ therapistId: 'ben' }),
        candidate({ therapistId: 'cara' }),
      ],
    });
    expect(plan[0].proposedTargetId).toBe('ben');
    expect(plan[1].proposedTargetId).toBe('cara');
  });
});
