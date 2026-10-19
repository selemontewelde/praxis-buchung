# Double-booking is prevented by a database exclusion constraint

Milestone 5 made booking possible. The hard requirement (issue #14) is that two
concurrent requests for the same therapist and time can never both succeed — and
that this holds under real concurrency, not just in a check-then-insert that two
requests can both pass.

**Decision.** Enforce it in **PostgreSQL** with a GiST **exclusion constraint**,
not in application code:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD CONSTRAINT "appointment_no_overlap"
  EXCLUDE USING gist ("therapistId" WITH =, tstzrange("startAt","endAt") WITH &&)
  WHERE (status = 'BOOKED');
```

- It forbids any two **BOOKED** appointments for the same therapist whose time
  ranges overlap — covering both the exact-same-slot case and overlaps between
  services of different durations. `tstzrange` is half-open `[start, end)`, so
  back-to-back appointments (end == next start) are allowed.
- The predicate `WHERE status = 'BOOKED'` means a cancelled appointment stops
  blocking its slot, so cancellation frees it for rebooking without deleting the
  row (keeps history; see the Cancellation glossary term).
- Prisma can't express this, so it lives in a hand-written `--create-only`
  migration; `btree_gist` is enabled in the same migration.

The booking service still re-validates the slot against the slot engine first
(for clear "not available / past lead time" errors), but that is UX, not the
guarantee. The constraint is the guarantee: on a concurrent race the loser's
insert fails with SQLSTATE 23P01, which the service maps to **409 Conflict**.

Alternatives rejected: a `UNIQUE(therapistId, startAt)` index (only catches
identical starts, not overlapping durations); serializable transactions or
`SELECT … FOR UPDATE` (more application complexity and lock management for a
guarantee the database can give declaratively).

## Consequences

- Correctness does not depend on application timing or a single app instance —
  two processes, or two requests racing in one process, are both handled.
- The guarantee is proven by an **integration test against a real Postgres** (two
  concurrent bookings → exactly one wins, loser gets 409); CI runs a Postgres
  service so the proof holds there too. Unit tests mock Prisma and can't prove it.
- Requires the `btree_gist` extension (available on standard Postgres; the
  compose and CI superuser can `CREATE EXTENSION`). The production database must
  allow it too (revisit at the deployment milestone).
- Cancellation is a status change (`BOOKED` → `CANCELLED`), never a delete, which
  is what makes the partial predicate free the slot while preserving the record.
