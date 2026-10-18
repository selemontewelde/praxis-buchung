# Config file seeds; the database is the source of truth for operational data

The product is sold as a template customised per practice via a config file, so it is
tempting to keep the team and the service catalogue in that file. We decided against it:
therapists fluctuate (hires, departures, future-dated starts) and what the practice can
offer changes as therapists complete training (e.g. adding Manuelle Therapie after the
course), and neither can require a code change and redeploy by non-technical staff.

**Decision.** The config file holds only branding, contact and legal placeholders, plus an
initial **seed** for the demo practice (team, services, capabilities, hours). At runtime the
**database is the source of truth** for all operational data — therapists, services,
capabilities, opening/working hours, blocks and appointments — all editable in the admin
without a deploy. The "customise via config, no code change" promise therefore covers
**rebranding and launching** a new practice, not day-to-day operation.

## Consequences

- Therapists are never hard-deleted; departure/future-start is modelled as an `active-from` /
  `active-until` range, preserving appointment history.
- Service ↔ therapist Capability is an admin-editable mapping (see ADR for qualification
  modelling if a dedicated Qualification entity is ever introduced — deferred to `later`).
- Reassigning a departing therapist's future appointments is a `later` feature; the MVP admin
  only cancels them.
