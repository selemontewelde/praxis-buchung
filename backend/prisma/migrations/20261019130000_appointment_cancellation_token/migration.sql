-- Single-use token for the patient self-service cancellation link.
ALTER TABLE "Appointment" ADD COLUMN "cancellationToken" TEXT;

CREATE UNIQUE INDEX "Appointment_cancellationToken_key" ON "Appointment"("cancellationToken");
