# Slot engine: pure minute-of-day core, UTC at the edges, Luxon for DST

Milestone 4 built the slot calculation — the most logic-heavy and correctness-
critical part of the product. Two questions had to be settled: how to structure the
code so it is thoroughly testable, and how to handle time correctly across DST.

**Decision.**

1. **A pure core in the minute-of-day domain.** `computeSlots` takes opening and
   working windows, busy intervals, grid and duration *as minutes from local
   midnight* and returns free slot start-minutes. It has no I/O, no clock and no
   timezone. Every booking rule (grid, window fit, intersection, duration, overlap)
   is a one-line-per-rule unit test with hand-written expected values.

2. **Policies as separate pure functions.** Buffer (`applyBuffer`), lead time and
   horizon (`withinBookingWindow`) are pure and tested in isolation, not folded
   into the core.

3. **Timezone/DST isolated behind Luxon, at the edges.** A thin `timezone` module
   converts wall-clock minutes ↔ UTC instants for a specific local date, DST-aware.
   Slots are generated on the *local* grid (patients see 08:00, 08:15 … regardless
   of season) and only the final start is mapped to a UTC instant for storage and
   the API. Non-existent spring-forward times are rejected; the fall-back ambiguous
   hour resolves deterministically (both are outside opening hours anyway).

4. **A thin orchestration service.** `SlotService` is the only impure piece: it
   loads from the DB, maps appointments/blocks into the minute domain, applies the
   capability and active-range filters, calls the pure core, and maps back to UTC.

Alternatives rejected: computing directly in UTC instants (every test would carry a
timezone and DST would leak into the core); hand-rolling offset math with `Intl`
(error-prone around transitions); doing the timezone conversion inside the core
(would make it impure and the DST edge cases untestable in isolation).

## Consequences

- The hard parts (rule math, DST) are covered by fast, deterministic unit tests
  with no database or clock; the DB service stays thin and is tested with a mock.
- Opening/working hours are wall-clock weekly rules (minutes), consistent with how
  they are stored (ADR-0001's time model); only instants (appointments, blocks,
  emitted slots) are UTC.
- A `now`-dependent rule (lead time, horizon) takes `now` as a parameter, so it is
  tested without faking the system clock.
- The engine assumes appointments/blocks never span local midnight (true for an
  08:00–18:00 practice); supporting overnight availability would need the busy
  mapping revisited. Documented in `slot.service.ts`.
- Adds a runtime dependency on Luxon for correct zoned date math.
