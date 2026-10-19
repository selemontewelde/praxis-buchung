-- Timestamp of the 24h reminder, so each appointment is reminded at most once.
ALTER TABLE "Appointment" ADD COLUMN "reminderSentAt" TIMESTAMPTZ(3);
