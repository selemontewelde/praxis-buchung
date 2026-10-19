import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { SlotService } from '../slots/slot.service.js';
import { GetSlotsQueryDto } from './dto/get-slots.query.js';
import { PublicSlotsController } from './slots.controller.js';

function query(over: Partial<GetSlotsQueryDto> = {}): GetSlotsQueryDto {
  return {
    serviceId: 'physio',
    from: '2026-06-15',
    to: '2026-06-20',
    ...over,
  } as GetSlotsQueryDto;
}

describe('PublicSlotsController', () => {
  it('delegates to the slot engine and returns its result', async () => {
    const result = [
      { therapistId: 'anna', firstName: 'Anna', lastName: 'Keller', slots: [] },
    ];
    const getAvailableSlots = vi.fn().mockResolvedValue(result);
    const controller = new PublicSlotsController({
      getAvailableSlots,
    } as unknown as SlotService);

    const response = await controller.getSlots(query({ therapistId: 'anna' }));

    expect(getAvailableSlots).toHaveBeenCalledWith({
      serviceId: 'physio',
      therapistId: 'anna',
      fromDate: '2026-06-15',
      toDate: '2026-06-20',
    });
    expect(response).toBe(result);
  });

  it('rejects a reversed date range', async () => {
    const controller = new PublicSlotsController({
      getAvailableSlots: vi.fn(),
    } as unknown as SlotService);

    await expect(
      controller.getSlots(query({ from: '2026-06-20', to: '2026-06-15' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a well-formatted but impossible date', async () => {
    const controller = new PublicSlotsController({
      getAvailableSlots: vi.fn(),
    } as unknown as SlotService);

    await expect(
      controller.getSlots(query({ from: '2026-13-40' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
