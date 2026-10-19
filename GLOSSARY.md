# praxis-buchung

The booking domain for a single physiotherapy practice: who works there, what they
offer, when they are available, and the appointments patients book.

## Language

### People

**Practice**:
The single physiotherapy practice this instance serves. Exactly one per deployment.
_Avoid_: tenant, clinic, organisation

**Therapist**:
A member of the practice's team who delivers services. Created and managed in the admin, never hard-deleted.
_Avoid_: employee, staff, provider, doctor

**Patient**:
The person who books an appointment. Only name, email and phone are stored — no health data.
_Avoid_: client, customer, user

### Offering

**Service**:
A bookable treatment type with a fixed duration (e.g. "Manuelle Therapie", 20 min). Not a billing position.
_Avoid_: treatment, offering, product

**Capability**:
The fact that a given Therapist may deliver a given Service, set in the admin (it reflects the therapist's training). Booking only offers a therapist for services they are capable of.
_Avoid_: qualification, skill, competency

### Scheduling

**Opening hours**:
The practice's recurring weekly open window per weekday; the outer boundary for all slots.
_Avoid_: business hours

**Working hours**:
A therapist's recurring weekly availability, always inside the Opening hours.
_Avoid_: shift, roster

**Block**:
A one-off or date-ranged period a therapist is unavailable (vacation, training, rehab, sick). Managed in the admin. German UI term: "Sperrzeit".
_Avoid_: absence, timeoff, holiday

**Active range**:
A therapist's `active-from` / `active-until` dates. Slots are generated only within this range — this is how a future-dated hire and a departing therapist are handled.

**Deactivate**:
End a therapist's Active range so they take no new bookings, while keeping their appointment history. Never a hard delete.
_Avoid_: delete, remove, archive

### Booking

**Slot**:
A candidate appointment start on the configurable grid that is free for a capable, active therapist (inside opening + working hours, not covered by a Block or existing Appointment).
_Avoid_: timeslot, opening

**Appointment**:
A booked slot: therapist + service + start time + patient. The durable result of a booking.
_Avoid_: booking (the act), reservation, event

**Booking**:
The patient-facing act of creating an Appointment.
_Avoid_: appointment (the result)

**Cancellation**:
The patient ending a booked Appointment before its start, via the single-use link
in the confirmation email, up to the cancellation deadline. Sets the Appointment to
cancelled (never deleted) and frees the slot. German UI term: "stornieren".
_Avoid_: delete, remove
