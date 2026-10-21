-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'THERAPIST');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN     "therapistId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_therapistId_key" ON "AdminUser"("therapistId");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
