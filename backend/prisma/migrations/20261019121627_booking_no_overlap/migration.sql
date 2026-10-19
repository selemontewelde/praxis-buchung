-- Prevent two overlapping BOOKED appointments for the same therapist, enforced by
-- the database so concurrent bookings cannot both succeed. Uses a GiST exclusion
-- constraint over the time range; btree_gist allows mixing the equality check on
-- therapistId with the range-overlap (&&) check. Cancelled appointments are
-- excluded via the predicate, so a freed slot can be rebooked.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "appointment_no_overlap"
  EXCLUDE USING gist (
    "therapistId" WITH =,
    tstzrange("startAt", "endAt") WITH &&
  )
  WHERE (status = 'BOOKED');
