# Spec: Praxis-Buchung MVP

> Product requirements document for the MVP. Uses the vocabulary from `GLOSSARY.md` and
> respects `docs/adr/0001-config-seeds-db-is-source-of-truth.md`. `/to-tickets` slices this
> into milestone issues.

## Problem Statement

A single physiotherapy practice needs an online presence where patients can book appointments
themselves, around the clock, without phoning during opening hours. The practice owner wants a
product they can buy once and brand for their practice without touching code, and the reception
staff need to keep the team, availability and appointments current without a developer. From
the patient's perspective: "I want to see when a therapist is actually free and book a slot in a
minute, on my phone, and get a confirmation I can rely on." From the practice's perspective: "I
want the booking calendar to reflect reality — no double bookings, no slots offered when the
therapist is on holiday — and I want to run day-to-day changes myself."

This is also a fullstack + DevOps portfolio reference, so the same solution must demonstrate a
real pipeline (CI, containers, deployment, HTTPS, backup).

## Solution

A configurable website for one practice with public pages and an online booking flow, backed by
an admin area for day-to-day operation.

- The **public website** (DE + EN, German default) renders Start, Services, Team, Contact, and
  placeholder Impressum/Datenschutz from the practice's data, mobile-first and accessible.
- The **booking flow** lets a patient pick a Service and optionally a Therapist, see real free
  Slots, enter name/email/phone with a privacy consent, and book immediately. A confirmation
  email with a cancellation link is sent. Double bookings are impossible, even under concurrent
  requests.
- A **reminder email** goes out 24 h before the appointment.
- The **admin area** (single account, German) manages Therapists, their Capabilities and active
  range, Opening hours, Working hours, Blocks, the Service catalogue, and the appointment list
  with cancellation.
- A new practice is **launched/rebranded via a config file** (branding, contact, legal, plus an
  initial seed); all operational data lives in the database and is edited in the admin.

## User Stories

**Public website (patient / visitor)**

1. As a visitor, I want a start page that states what the practice offers and a clear "book now"
   path, so that I can act immediately.
2. As a visitor, I want to see the list of Services with a short description and duration, so that
   I know what I can book.
3. As a visitor, I want to see the Team with name, role and photo, so that I know who would treat me.
4. As a visitor, I want contact details and the practice address/map, so that I can find and reach
   the practice.
5. As a visitor, I want Impressum and Datenschutz placeholder pages, so that the site is legally
   presentable (Swiss revDSG wording).
6. As a visitor on a phone, I want the site to be fast and mobile-first, so that booking is easy
   on the go.
7. As a visitor using a screen reader or keyboard, I want accessible pages, so that I can use the
   site regardless of ability.
8. As an English-speaking visitor, I want to switch the public site to English, so that I can read
   it; if a text has no English translation it falls back to German.

**Booking flow (patient)**

9. As a patient, I want to choose a Service, so that the system knows the appointment duration.
10. As a patient, I want to optionally choose a specific Therapist, so that I can keep my usual one.
11. As a patient who does not choose a Therapist, I want to see combined availability of all
    capable Therapists, so that I get the earliest free slot.
12. As a patient, I want to see only real free Slots (respecting opening hours, working hours,
    blocks, existing appointments, lead time and horizon), so that I never pick an impossible time.
13. As a patient, I want slots shown in local time (Europe/Zurich), so that there is no confusion.
14. As a patient, I want to enter name, email and phone and tick a privacy consent, so that I can
    confirm the booking lawfully.
15. As a patient, I want an optional free-text note (explicitly no health details), so that I can
    add context like "first visit".
16. As a patient, I want the booking to be confirmed immediately, so that I know the slot is mine.
17. As a patient, I must never be able to book a slot that another patient booked at the same
    moment, so that I don't show up to a taken appointment.
18. As a patient, I want a confirmation email with the appointment details and a cancellation link,
    so that I have a record and can cancel.
19. As a patient, I want the booking form to reject invalid input (bad email, missing consent)
    with clear messages, so that I can correct it.

**Cancellation & reminders (patient)**

20. As a patient, I want to cancel via the link in my confirmation email up to 24 h before the
    appointment, so that I can free the slot without phoning.
21. As a patient who clicks the cancellation link after the 24 h deadline, I want a clear "deadline
    passed — please call the practice" page, so that I know what to do.
22. As a patient, I want a cancellation confirmation email, so that I know the cancellation worked.
23. As a patient, I want a reminder email 24 h before my appointment (without an active
    cancellation link, with a note to call for short-notice changes), so that I don't forget.
24. As a patient, I understand there is no online rescheduling — I cancel and rebook.

**Admin — authentication & shell**

25. As the practice admin, I want to log in with a username/email and password, so that only staff
    can manage data.
26. As the practice admin, I want my session kept in a secure HTTP-only cookie and to be able to
    log out, so that access is safe and revocable.
27. As the practice admin, I want the admin area in German, so that it fits the staff.

**Admin — therapists & capabilities**

28. As the admin, I want to create a Therapist (name, role, photo), so that they appear on the
    site and can be booked.
29. As the admin, I want to set a Therapist's active-from / active-until dates, so that a
    future-dated hire only becomes bookable on their start date and a departing one stops after.
30. As the admin, I want to deactivate a Therapist without deleting them, so that appointment
    history is preserved.
31. As the admin, I want to set which Services a Therapist is capable of, so that booking only
    offers them for treatments they are trained for (e.g. add MT once the course is done).

**Admin — availability**

32. As the admin, I want to set the practice Opening hours per weekday (including a lunch gap), so
    that they bound all slots.
33. As the admin, I want to set each Therapist's Working hours within the opening hours, so that
    part-time schedules are respected.
34. As the admin, I want to add Blocks (vacation, training, rehab, sick) for a Therapist, so that
    no slots are offered during absences.

**Admin — services & appointments**

35. As the admin, I want to manage the Service catalogue (name, duration), so that the offering
    stays current without a deploy.
36. As the admin, I want to see the list of upcoming and past appointments with patient and
    therapist, so that I have an overview.
37. As the admin, I want to cancel an appointment (patient gets the cancellation email), so that I
    can handle phone cancellations and freed slots.
38. As the admin, when I deactivate a Therapist with open future appointments, I want to see those
    appointments so that I can cancel them (reassignment is out of scope for the MVP).

**Practice owner / configuration**

39. As the practice owner, I want to set branding (name, colours, logo), contact and legal text in
    a config file, so that I can rebrand without code changes.
40. As the practice owner, I want the config file to seed an initial demo practice (team, services,
    capabilities, hours) on first run, so that the system is usable immediately.
41. As the practice owner, I want the booking policy values (slot grid default 30 min, buffer,
    booking horizon 8 weeks, minimum lead time 2 h, cancellation deadline 24 h, timezone) to be
    configurable, so that I can adapt them to my practice.

**Operability (portfolio / ops)**

42. As an operator, I want a `/health` endpoint that also checks the database, so that monitoring
    can tell if the app is truly up.
43. As an operator, I want the whole stack to run locally with one Docker Compose command, so that
    onboarding is trivial.
44. As an operator, I want emails captured by Mailpit locally and sent via SMTP (env vars) in
    staging/production, so that I can test without sending real mail.

## Implementation Decisions

- **Architecture boundary (ADR-0001).** Config file = branding/contact/legal + first-run seed;
  the database is the source of truth for Therapists, Services, Capabilities, Opening/Working
  hours, Blocks and Appointments. All operational data is editable in the admin without a deploy.
- **Monorepo** with `frontend/` (Angular, standalone components + signals), `backend/` (NestJS,
  REST), `infra/`, and a root `docker-compose.yml`.
- **Database**: PostgreSQL via Prisma (migrations + seed). Seed is derived from the practice config.
- **Time**: all timestamps stored in UTC; displayed in the practice timezone (default
  `Europe/Zurich`). DST transition days are an explicit slot-engine edge case.
- **Slot model**: candidate Slot starts fall on a configurable grid (default 30 min). Each Service
  has a fixed duration (multiple of 5 min). A configurable buffer (default 0) is added after each
  appointment. A Slot is offered only if, for a capable and active Therapist, it lies inside
  Opening hours and Working hours, is not covered by a Block or existing Appointment, is at least
  the minimum lead time ahead (default 2 h), and within the booking horizon (default 8 weeks).
- **Capability**: a direct Therapist↔Service mapping, admin-editable (no separate Qualification
  entity in the MVP).
- **Therapist lifecycle**: `active-from` / `active-until` (both nullable); never hard-deleted.
- **Booking**: created immediately (status confirmed), no email double-opt-in. Double bookings are
  prevented at the **database level** so two concurrent requests for the same Therapist and time
  cannot both succeed (exact mechanism — e.g. a uniqueness/exclusion constraint within a
  transaction — to be decided and recorded as an ADR in the slot/booking milestone, verified by
  the concurrency test).
- **Consent**: store a consent record (timestamp + version of the privacy text) with the booking.
  Only name, email, phone (+ optional note) are stored; no health data.
- **Cancellation**: each Appointment carries an unguessable cancellation token used in the email
  link. Online cancellation is allowed until the configurable deadline (default 24 h before);
  after that the link shows a "please call" page. No online rescheduling.
- **Emails**: confirmation (details + active cancellation link), cancellation confirmation, and a
  24 h reminder (no active link, note to call). Mailpit locally; SMTP via env vars elsewhere.
- **Admin auth**: hashed passwords (Argon2/bcrypt) + server-side session in an HTTP-only, Secure,
  SameSite cookie — not JWT (rationale recorded as an ADR in the admin milestone). Single admin
  account in the MVP.
- **i18n**: public site DE + EN with German default and German fallback for missing translations;
  translatable content fields carry a DE and EN value. Admin is German-only.
- **Validation**: all API inputs validated server-side (NestJS validation pipe) with clear errors.
- **Health**: `/health` endpoint performs a database connectivity check.
- **Versions**: current stable versions of Angular, NestJS, Prisma, PostgreSQL, Playwright and
  Caddy are checked against npm / official docs at scaffolding time, not assumed from memory.
  Project Node version is 22.

## Testing Decisions

Tests assert **external behavior**, never implementation details, so they survive refactors.
Three seams were agreed (greenfield — all new, placed as high as possible):

- **Seam 1 — Slot engine (pure unit).** The availability/slot calculation is a pure TypeScript
  module in the backend: inputs (opening hours, working hours, blocks, existing appointments,
  service duration, grid, buffer, horizon, lead time, capability, active range, "now") → output
  (free slots). This carries the **bulk of the tests**, built test-first (TDD), with exhaustive
  edge cases: grid alignment, buffer, overlapping appointments and blocks, lead-time and horizon
  boundaries, therapist active-from/until, capability filtering, empty results, and DST transition
  days. No database or HTTP involved.
- **Seam 2 — Booking use-case against a real test PostgreSQL (backend integration).** Invariants
  that are only true because of the database are tested at the booking service/use-case boundary
  with a **real Postgres** (e.g. Testcontainers or a dedicated compose test DB): two concurrent
  bookings for the same therapist+slot → exactly one succeeds; consent record is persisted;
  cancellation by token works and is idempotent; cancellation deadline is enforced; status
  transitions are correct.
- **Seam 3 — One Playwright E2E (browser).** A single happy-path "book an appointment" test
  through the real UI and API, as a thin smoke test of the whole stack (local in the MVP; adding
  it to CI is a `later` item).

Public website rendering and admin CRUD get **deliberately light** coverage (a few component /
endpoint tests), not exhaustive suites. There is no prior art in this greenfield repo; these seams
and their tools (backend unit runner, a real test Postgres, Playwright) are established in the
scaffolding and slot milestones.

## Out of Scope

- Payments, prescriptions/billing, patient records, diagnoses or any health data.
- SMS notifications; `.ics`/add-to-calendar.
- Multiple practices per instance; native mobile apps.
- Rooms/equipment as a bookable resource (only therapist time is constrained).
- Reassigning/splitting a departing therapist's future appointments (MVP only cancels them).
- A dedicated Qualification entity; per-therapist logins and roles.
- Languages beyond DE/EN.
- The DevOps "later" items: separate staging/production with manual approval, multi-arch images,
  rollback workflow, release notes, uptime monitoring/alerting, structured logs, security scans,
  Dependabot/Renovate, Playwright in CI, extended runbook.

## Further Notes

- **Milestone mapping**: 1 scaffold/CI/compose; 2 Prisma schema + seed + config; 3 public website
  from config; 4 slot engine (TDD, Seam 1); 5 booking + confirmation/cancellation email (Seam 2);
  6 reminder job; 7 admin + login; 8 deployment (prod Dockerfiles, GHCR, SSH deploy, HTTPS, backup);
  9 security pass + one Playwright booking test (Seam 3) + polish; 10 portfolio polish.
- **Seed example (to finalise in milestone 2)**: the demo practice has 1–2 therapists reflecting a
  realistic start — e.g. one therapist holding MLD and adding MT/KGG capabilities over time — and
  services based on the 30-min Swiss standard session plus a few variants.
- **Learning mode**: every issue starts with a short plan and waits for the developer's OK; the
  developer writes at least one part per milestone (`// TODO(Selemon):`), pushes and merges himself.
