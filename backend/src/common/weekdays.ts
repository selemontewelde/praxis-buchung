/**
 * Weekday names in the order of the Prisma `Weekday` enum, which is also the
 * luxon weekday order minus one (luxon Monday = 1). Index with `weekday - 1` to
 * map a luxon DateTime to the stored weekday. Shared by the slot engine's
 * orchestration and the admin reassignment planner so the mapping stays in sync.
 */
export const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;
