/**
 * Pure planner for reassigning a departing therapist's future appointments to
 * other therapists. No I/O: the admin service gathers the data (future
 * appointments, candidate therapists with their capabilities, active range, busy
 * intervals, vacation blocks and working windows) and this function decides, per
 * appointment, who should take it — distinguishing hard disqualifiers from soft
 * warnings the admin may override.
 *
 * Hard (a candidate is excluded): no capability, inactive at the time, or an
 * overlapping booked appointment (would double-book). Soft (chosen but flagged):
 * the candidate is on vacation (overlapping block) or the appointment falls
 * outside their working hours. A warning-free candidate is always preferred.
 *
 * Instants are epoch-ms intervals [start, end); the weekday + local minutes are
 * precomputed by the caller (timezone math stays out of here) and drive only the
 * working-hours warning.
 */

/** A half-open time interval in epoch milliseconds: [start, end). */
export interface Interval {
  start: number;
  end: number;
}

export interface ReassignAppointment {
  id: string;
  serviceId: string;
  start: number;
  end: number;
  /** Local weekday of the appointment (e.g. "WEDNESDAY"), for the hours warning. */
  weekday: string;
  /** Local minute-of-day of start/end, for the hours warning. */
  localStartMin: number;
  localEndMin: number;
}

export interface CandidateWindow {
  weekday: string;
  startMin: number;
  endMin: number;
}

export interface ReassignCandidate {
  therapistId: string;
  capableServiceIds: string[];
  activeFrom: number;
  activeUntil: number | null;
  /** Existing booked appointments — a hard overlap excludes the candidate. */
  busy: Interval[];
  /** Vacation/blocks — an overlap is a soft ON_VACATION warning, not a block. */
  blocks: Interval[];
  workingWindows: CandidateWindow[];
}

export type ReassignWarning = 'ON_VACATION' | 'OUTSIDE_WORKING_HOURS';
export type UnassignableReason = 'NO_CAPABLE_CANDIDATE' | 'ALL_CANDIDATES_BUSY';

export interface ReassignEntry {
  appointmentId: string;
  proposedTargetId: string | null;
  warnings: ReassignWarning[];
  unassignableReason?: UnassignableReason;
}

export interface PlanReassignmentInput {
  appointments: ReassignAppointment[];
  candidates: ReassignCandidate[];
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

function activeAt(
  candidate: ReassignCandidate,
  appt: ReassignAppointment,
): boolean {
  if (candidate.activeFrom > appt.start) return false;
  if (candidate.activeUntil !== null && candidate.activeUntil < appt.end) {
    return false;
  }
  return true;
}

// True if a single working window fully contains the appointment. An appointment
// straddling two adjacent windows would read as "outside", but this only drives a
// soft warning the admin can weigh, so merging adjacent windows isn't worth it.
function withinWorkingHours(
  candidate: ReassignCandidate,
  appt: ReassignAppointment,
): boolean {
  return candidate.workingWindows.some(
    (w) =>
      w.weekday === appt.weekday &&
      w.startMin <= appt.localStartMin &&
      w.endMin >= appt.localEndMin,
  );
}

function warningsFor(
  candidate: ReassignCandidate,
  appt: ReassignAppointment,
): ReassignWarning[] {
  const warnings: ReassignWarning[] = [];
  if (candidate.blocks.some((b) => overlaps(appt, b))) {
    warnings.push('ON_VACATION');
  }
  if (!withinWorkingHours(candidate, appt)) {
    warnings.push('OUTSIDE_WORKING_HOURS');
  }
  return warnings;
}

export function planReassignment(
  input: PlanReassignmentInput,
): ReassignEntry[] {
  // Assignments made within this plan accrue onto each candidate's busy set, so a
  // candidate that just took an overlapping appointment can't take another.
  const assigned = new Map<string, Interval[]>();
  for (const candidate of input.candidates) {
    assigned.set(candidate.therapistId, [...candidate.busy]);
  }

  // Deterministic order: earliest first, ties by id.
  const appointments = [...input.appointments].sort(
    (a, b) => a.start - b.start || a.id.localeCompare(b.id),
  );

  return appointments.map((appt) => {
    let anyCapableActive = false;
    const eligible: { id: string; warnings: ReassignWarning[] }[] = [];

    for (const candidate of input.candidates) {
      if (!candidate.capableServiceIds.includes(appt.serviceId)) continue;
      if (!activeAt(candidate, appt)) continue;
      anyCapableActive = true;
      const taken = assigned.get(candidate.therapistId) ?? [];
      if (taken.some((t) => overlaps(appt, t))) continue;
      eligible.push({
        id: candidate.therapistId,
        warnings: warningsFor(candidate, appt),
      });
    }

    if (eligible.length === 0) {
      return {
        appointmentId: appt.id,
        proposedTargetId: null,
        warnings: [],
        unassignableReason: anyCapableActive
          ? 'ALL_CANDIDATES_BUSY'
          : 'NO_CAPABLE_CANDIDATE',
      };
    }

    // Prefer a warning-free candidate (first in the caller's order); otherwise the
    // first eligible one, carrying its warnings for the admin to weigh.
    const chosen = eligible.find((c) => c.warnings.length === 0) ?? eligible[0];
    assigned.get(chosen.id)?.push({ start: appt.start, end: appt.end });
    return {
      appointmentId: appt.id,
      proposedTargetId: chosen.id,
      warnings: chosen.warnings,
    };
  });
}
