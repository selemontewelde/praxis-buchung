# Rooms/equipment as a second bookable resource axis

Until now a slot depended on one resource: the therapist. Some treatments need a
shared room or piece of equipment (e.g. the Geräteraum for medical training
therapy), so a slot must also require that room to be free, and the room must
never be double-booked — not even by two different therapists. This records how
that second resource axis was added. It builds on ADR-0006 (appointments as UTC
instants) and ADR-0007 (double-booking prevented by a GiST exclusion constraint).

## Decisions

**1. A room is a single-occupancy resource a service may require.** A new `Room`
entity models a room or piece of equipment. `Service.roomId` optionally points at
the room a service needs (null = therapist-only, as before); the `Appointment`
copies that `roomId` at booking time so the occupancy is recorded on the booking
itself. Deliberately scoped small: **one** optional room per service — no room
pool, no "assign any free room", no capacity > 1, and rooms have no opening hours
of their own (they are bookable whenever the practice is open, just not twice at
once). Those are later resource types, not this slice.

**2. A second partial exclusion constraint guards the room.** Beside the existing
`appointment_no_overlap` (therapist), a new `appointment_room_no_overlap`
`EXCLUDE USING gist ("roomId" WITH =, tstzrange(startAt,endAt) WITH &&)` with the
predicate `status = 'BOOKED' AND "roomId" IS NOT NULL` makes the **database** the
final guarantor that one room holds at most one appointment at a time — the same
concurrency-proof mechanism as the therapist guard (ADR-0007), extended to the
second axis. Room-less appointments (`roomId IS NULL`) are outside the predicate,
so they carry no room to clash over.

**3. Availability is the intersection of every required resource; the pure engine
is unchanged.** A slot is offered only where the therapist *and* the room are
free. Rather than teach the pure `computeSlots` engine about resources, the slot
service folds the room's busy intervals (every BOOKED appointment in that room,
across all therapists) into each therapist's busy set before calling the engine.
The engine still just removes busy intervals from availability — resources are an
orchestration concern, kept out of the core algorithm.

## Consequences

- A room-requiring service shared by several therapists serialises them on that
  room: if one therapist's booking holds the room, the slot disappears for the
  others too — exactly the intended behaviour, visible in the seeded "mtt" demo.
- Two independent concurrency guarantees now exist (therapist, room). A booking
  can fail either constraint; both surface as the same 409, so callers are
  unaffected.
- The model generalises to more resource types later (a pool, per-room hours,
  capacity) by adding axes the same way — fold their busy into the set, add a
  constraint — without reopening the pure engine.
- The config/seed now carry rooms and a service→room link, keeping the
  "customise by config only" promise intact.
