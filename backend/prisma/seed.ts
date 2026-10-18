import { PrismaPg } from '@prisma/adapter-pg';
import { practiceConfig } from '../../config/practice.config.js';
import { validatePracticeConfig } from '../../config/practice-config.validation.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

/**
 * Seeds the demo practice from the practice config into the database.
 *
 * Run explicitly with `npx prisma db seed` (Prisma 7 no longer seeds
 * automatically after migrate). This is a standalone script — it is not part of
 * the Nest app, so it builds its own PrismaClient with the same `@prisma/adapter-pg`
 * driver adapter the app uses, rather than going through Nest's DI.
 *
 * Seeding is idempotent:
 *   - Therapists, services and capabilities are keyed on their stable config
 *     `key` (or the therapist+service pair) and written with `upsert`, so a
 *     re-run updates them in place. Entities removed from the config are left
 *     behind (a demo seed, not a full sync).
 *   - Opening and working hours have no stable business key — they are pure
 *     config-derived recurring rules with nothing referencing them — so they are
 *     fully replaced each run (delete + recreate). That keeps the DB matching the
 *     config exactly, with no rows orphaned when a window's time is edited.
 */
async function main(): Promise<void> {
  // Fail early and clearly if the config contradicts itself.
  validatePracticeConfig(practiceConfig);

  const { seed } = practiceConfig;
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? '',
  });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$transaction(async (tx) => {
      for (const service of seed.services) {
        await tx.service.upsert({
          where: { id: service.key },
          create: {
            id: service.key,
            name: service.name,
            durationMin: service.durationMin,
          },
          update: { name: service.name, durationMin: service.durationMin },
        });
      }

      for (const therapist of seed.therapists) {
        const data = {
          firstName: therapist.firstName,
          lastName: therapist.lastName,
          title: therapist.title ?? null,
          activeFrom: new Date(therapist.activeFrom),
        };
        await tx.therapist.upsert({
          where: { id: therapist.key },
          create: { id: therapist.key, ...data },
          update: data,
        });
      }

      for (const capability of seed.capabilities) {
        await tx.capability.upsert({
          where: {
            therapistId_serviceId: {
              therapistId: capability.therapist,
              serviceId: capability.service,
            },
          },
          create: {
            therapistId: capability.therapist,
            serviceId: capability.service,
          },
          update: {},
        });
      }

      // Recurring hours are fully replaced from the config (see header).
      await tx.openingHours.deleteMany();
      await tx.openingHours.createMany({
        data: seed.openingHours.map((window) => ({
          weekday: window.weekday,
          startMin: window.startMin,
          endMin: window.endMin,
        })),
      });

      await tx.workingHours.deleteMany();
      await tx.workingHours.createMany({
        data: seed.workingHours.map((window) => ({
          therapistId: window.therapist,
          weekday: window.weekday,
          startMin: window.startMin,
          endMin: window.endMin,
        })),
      });
    });

    console.log(
      `Seeded "${practiceConfig.branding.name}": ` +
        `${seed.therapists.length} therapists, ${seed.services.length} services, ` +
        `${seed.capabilities.length} capabilities, ` +
        `${seed.openingHours.length} opening-hour windows, ` +
        `${seed.workingHours.length} working-hour windows.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
