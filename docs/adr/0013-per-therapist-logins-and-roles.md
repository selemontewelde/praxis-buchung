# Per-therapist logins and role-based authorization

The MVP had a single admin login (ADR-0008). A practice needs each therapist to
sign in and manage their own schedule, while reception/the owner manages
everything. This records adding roles and per-therapist identities on top of the
existing session auth, without changing the session mechanism itself.

## Decisions

**1. Extend the existing `AdminUser` + session, don't replace them.** The session
model (a hashed token in an HTTP-only cookie, revocable, ADR-0008) is unchanged.
`AdminUser` gains a `role` (`ADMIN` | `THERAPIST`, default `ADMIN` so the existing
seed stays admin) and an optional, unique `therapistId` linking a THERAPIST login
to the therapist it represents. The table keeps its name: renaming it to `User`
would be a wide, mechanical refactor for no behavioural gain.

**2. Two roles only.** `ADMIN` (reception/owner) manages everything; `THERAPIST`
manages only their own working hours, blocks and appointments (view + cancel). No
finer-grained permissions — the practice is small and the split is clean.

**3. Two complementary authorization mechanisms.** Coarse, whole-area access is a
`RolesGuard` driven by an `@Roles(['ADMIN'])` marker on the admin-only controllers
(team, services, reassignment, and practice-wide opening hours). Fine, per-record
ownership on the shared endpoints (working hours, blocks, appointments) is a pair
of pure helpers — `assertCanActOnTherapist` and `effectiveTherapistFilter` —
applied in the controllers: a THERAPIST is pinned to their own `therapistId` for
lists and rejected (or shown "not found") for another therapist's record, so a
resource's existence isn't revealed. Keeping the ownership decision pure makes it
unit-testable independent of HTTP.

**4. Logins are seed/config-driven.** Back-office users (email, password, role,
optional therapist key) live in the practice config and are seeded, like the rest
of the demo data; config validation enforces unique emails, at least one ADMIN,
and a valid one-to-one THERAPIST↔therapist link. A self-service admin UI to create
or reset logins is deliberately deferred.

## Consequences

- A therapist signs in and sees only their own data; reception retains full
  access. The booking/slot logic and the public site are untouched.
- Authorization is enforced on the backend regardless of the UI; a THERAPIST
  hitting an admin-only endpoint gets a 403 even if a stale UI shows the link
  (role-aware navigation is a follow-up frontend slice).
- Passwords still live in the config as dev-only credentials (as before); a real
  deployment must change them, and the lack of self-service password management is
  the boundary to revisit if the team grows.
- `AuthenticatedAdmin` now carries `role` + `therapistId`, surfaced via `/me` so
  the frontend can branch.
