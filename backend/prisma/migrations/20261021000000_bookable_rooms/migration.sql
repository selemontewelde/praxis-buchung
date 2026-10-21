-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- AlterTable
ALTER TABLE "Service" ADD COLUMN "roomId" TEXT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "roomId" TEXT;

-- CreateIndex
CREATE INDEX "Appointment_roomId_startAt_idx" ON "Appointment"("roomId", "startAt");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prevent two overlapping BOOKED appointments from occupying the same room,
-- enforced by the database so concurrent bookings cannot both take one room — the
-- second resource axis beside the per-therapist "appointment_no_overlap" guard.
-- btree_gist (already installed by the therapist constraint's migration) allows
-- mixing the equality check on roomId with the range-overlap (&&) check. The
-- predicate excludes cancelled appointments and room-less services (roomId IS
-- NULL), which carry no room to clash over.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "appointment_room_no_overlap"
  EXCLUDE USING gist (
    "roomId" WITH =,
    tstzrange("startAt", "endAt") WITH &&
  )
  WHERE (status = 'BOOKED' AND "roomId" IS NOT NULL);
