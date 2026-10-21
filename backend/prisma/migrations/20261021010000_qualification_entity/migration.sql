-- CreateTable
CREATE TABLE "Qualification" (
    "id" TEXT NOT NULL,
    "nameDe" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapistQualification" (
    "therapistId" TEXT NOT NULL,
    "qualificationId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TherapistQualification_pkey" PRIMARY KEY ("therapistId","qualificationId")
);

-- AddForeignKey
ALTER TABLE "TherapistQualification" ADD CONSTRAINT "TherapistQualification_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapistQualification" ADD CONSTRAINT "TherapistQualification_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "Qualification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
