import type {
  PracticeConfig,
  TimeWindow,
} from './practice-config.types.js';

/**
 * Thrown when a practice config is internally inconsistent. Carries every problem
 * found (not just the first) so a practice editing the config sees them all at once.
 */
export class PracticeConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid practice config:\n- ${problems.join('\n- ')}`);
    this.name = 'PracticeConfigError';
  }
}

const MINUTES_PER_DAY = 24 * 60;

function describeWindow(window: TimeWindow): string {
  return `${window.weekday} ${window.startMin}-${window.endMin}`;
}

/** True if `inner` fits entirely within `outer` on the same weekday. */
function isWithin(inner: TimeWindow, outer: TimeWindow): boolean {
  return (
    inner.weekday === outer.weekday &&
    inner.startMin >= outer.startMin &&
    inner.endMin <= outer.endMin
  );
}

/** True if `tz` is an IANA timezone the runtime recognises. */
function isValidTimezone(tz: string): boolean {
  try {
    // Intl.DateTimeFormat throws RangeError for an unknown zone.
    return Boolean(Intl.DateTimeFormat(undefined, { timeZone: tz }));
  } catch {
    return false;
  }
}

/**
 * Checks that the config's seed data is internally consistent before it is
 * written to the database:
 *
 *   - therapist and service keys are unique;
 *   - every capability and working-hours entry references a known therapist/service;
 *   - every time window is a valid span inside a single day (0 ≤ start < end ≤ 1440);
 *   - every working-hours window lies inside an opening-hours window of the same
 *     weekday (a therapist can't work when the practice is closed).
 *
 * Throws {@link PracticeConfigError} listing all problems; returns nothing on success.
 */
export function validatePracticeConfig(config: PracticeConfig): void {
  const problems: string[] = [];

  if (!isValidTimezone(config.timezone)) {
    problems.push(`invalid timezone "${config.timezone}"`);
  }

  const {
    gridMin,
    bufferMin,
    minLeadMinutes,
    horizonDays,
    cancellationDeadlineHours,
    reminderHoursBefore,
  } = config.booking;
  if (cancellationDeadlineHours < 0) {
    problems.push(
      `booking.cancellationDeadlineHours must not be negative, got ${cancellationDeadlineHours}`,
    );
  }
  if (reminderHoursBefore < 0) {
    problems.push(
      `booking.reminderHoursBefore must not be negative, got ${reminderHoursBefore}`,
    );
  }
  if (gridMin <= 0) {
    problems.push(`booking.gridMin must be positive, got ${gridMin}`);
  }
  if (bufferMin < 0) {
    problems.push(`booking.bufferMin must not be negative, got ${bufferMin}`);
  }
  if (minLeadMinutes < 0) {
    problems.push(
      `booking.minLeadMinutes must not be negative, got ${minLeadMinutes}`,
    );
  }
  if (horizonDays <= 0) {
    problems.push(`booking.horizonDays must be positive, got ${horizonDays}`);
  }

  const { therapists, services, capabilities, openingHours, workingHours } =
    config.seed;

  const therapistKeys = new Set<string>();
  for (const therapist of therapists) {
    if (therapistKeys.has(therapist.key)) {
      problems.push(`duplicate therapist key "${therapist.key}"`);
    }
    therapistKeys.add(therapist.key);
  }

  const serviceKeys = new Set<string>();
  for (const service of services) {
    if (serviceKeys.has(service.key)) {
      problems.push(`duplicate service key "${service.key}"`);
    }
    serviceKeys.add(service.key);
  }

  for (const capability of capabilities) {
    if (!therapistKeys.has(capability.therapist)) {
      problems.push(
        `capability references unknown therapist "${capability.therapist}"`,
      );
    }
    if (!serviceKeys.has(capability.service)) {
      problems.push(
        `capability references unknown service "${capability.service}"`,
      );
    }
  }

  const validate = (window: TimeWindow, label: string): boolean => {
    let ok = true;
    if (window.startMin < 0 || window.endMin > MINUTES_PER_DAY) {
      problems.push(`${label} ${describeWindow(window)} is outside 0–1440`);
      ok = false;
    }
    if (window.startMin >= window.endMin) {
      problems.push(`${label} ${describeWindow(window)} ends before it starts`);
      ok = false;
    }
    return ok;
  };

  for (const window of openingHours) {
    validate(window, 'opening hours');
  }

  for (const window of workingHours) {
    if (!therapistKeys.has(window.therapist)) {
      problems.push(
        `working hours reference unknown therapist "${window.therapist}"`,
      );
    }
    if (!validate(window, 'working hours')) {
      continue;
    }
    if (!openingHours.some((opening) => isWithin(window, opening))) {
      problems.push(
        `working hours for "${window.therapist}" (${describeWindow(window)}) ` +
          `are outside the practice's opening hours`,
      );
    }
  }

  if (problems.length > 0) {
    throw new PracticeConfigError(problems);
  }
}
