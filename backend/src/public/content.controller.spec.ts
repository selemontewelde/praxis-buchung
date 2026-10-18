import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { PublicContentController } from './content.controller.js';

function makeController(prisma: Partial<PrismaService>): PublicContentController {
  return new PublicContentController(prisma as PrismaService);
}

describe('PublicContentController', () => {
  describe('getServices', () => {
    it('maps services to the public shape', async () => {
      const prisma = {
        service: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'physio',
              name: 'Physiotherapie',
              durationMin: 30,
              descriptionDe: 'DE',
              descriptionEn: 'EN',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        },
      } as unknown as Partial<PrismaService>;

      const result = await makeController(prisma).getServices();

      expect(result).toEqual([
        {
          id: 'physio',
          name: 'Physiotherapie',
          durationMin: 30,
          descriptionDe: 'DE',
          descriptionEn: 'EN',
        },
      ]);
    });
  });

  describe('getTeam', () => {
    it('returns only active therapists, mapped to the public shape', async () => {
      const therapist = (over: Record<string, unknown>) => ({
        id: 'x',
        firstName: 'A',
        lastName: 'B',
        title: null,
        roleDe: 'Rolle',
        roleEn: 'Role',
        photoUrl: 'assets/team/x.svg',
        activeFrom: new Date('2024-01-01'),
        activeUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...over,
      });

      const prisma = {
        therapist: {
          findMany: vi.fn().mockResolvedValue([
            therapist({ firstName: 'Anna', activeUntil: null }),
            // Departed: active range ended in the past → must be excluded.
            therapist({
              firstName: 'Gone',
              activeUntil: new Date('2024-06-01'),
            }),
          ]),
        },
      } as unknown as Partial<PrismaService>;

      const result = await makeController(prisma).getTeam();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        firstName: 'Anna',
        roleDe: 'Rolle',
        roleEn: 'Role',
        photoUrl: 'assets/team/x.svg',
      });
      expect(result[0]).not.toHaveProperty('activeFrom');
    });
  });
});
