-- Archived services (active=false) are hidden from the public site and booking.
ALTER TABLE "Service" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
