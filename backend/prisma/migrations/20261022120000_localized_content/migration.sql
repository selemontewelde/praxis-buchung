-- Localized DB content (#129): replace each per-locale column pair with a single
-- JSONB column holding a LocalizedText map { de, en, fr?, it?, es? }. Existing
-- de/en values are migrated into the map, then the old columns are dropped
-- (expand -> migrate -> contract in one step; the content volume is tiny).

-- Therapist.role (nullable)
ALTER TABLE "Therapist" ADD COLUMN "role" JSONB;
UPDATE "Therapist"
SET "role" = jsonb_strip_nulls(jsonb_build_object('de', "roleDe", 'en', "roleEn"))
WHERE "roleDe" IS NOT NULL OR "roleEn" IS NOT NULL;
ALTER TABLE "Therapist" DROP COLUMN "roleDe", DROP COLUMN "roleEn";

-- Service.description (nullable)
ALTER TABLE "Service" ADD COLUMN "description" JSONB;
UPDATE "Service"
SET "description" = jsonb_strip_nulls(jsonb_build_object('de', "descriptionDe", 'en', "descriptionEn"))
WHERE "descriptionDe" IS NOT NULL OR "descriptionEn" IS NOT NULL;
ALTER TABLE "Service" DROP COLUMN "descriptionDe", DROP COLUMN "descriptionEn";

-- Qualification.name (required): backfill before enforcing NOT NULL.
ALTER TABLE "Qualification" ADD COLUMN "name" JSONB;
UPDATE "Qualification"
SET "name" = jsonb_build_object('de', "nameDe", 'en', "nameEn");
ALTER TABLE "Qualification" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Qualification" DROP COLUMN "nameDe", DROP COLUMN "nameEn";
