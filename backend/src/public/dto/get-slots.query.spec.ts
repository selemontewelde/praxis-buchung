import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { GetSlotsQueryDto } from './get-slots.query.js';

async function errorsFor(obj: unknown): Promise<string[]> {
  const errors = await validate(plainToInstance(GetSlotsQueryDto, obj));
  return errors.map((e) => e.property);
}

describe('GetSlotsQueryDto', () => {
  it('accepts a valid query', async () => {
    expect(
      await errorsFor({
        serviceId: 'physio',
        from: '2026-06-15',
        to: '2026-06-20',
      }),
    ).toEqual([]);
  });

  it('accepts an optional therapistId', async () => {
    expect(
      await errorsFor({
        serviceId: 'physio',
        therapistId: 'anna',
        from: '2026-06-15',
        to: '2026-06-20',
      }),
    ).toEqual([]);
  });

  it('rejects a missing serviceId', async () => {
    expect(
      await errorsFor({ from: '2026-06-15', to: '2026-06-20' }),
    ).toContain('serviceId');
  });

  it('rejects a from that is not YYYY-MM-DD', async () => {
    expect(
      await errorsFor({ serviceId: 'physio', from: '15.06.2026', to: '2026-06-20' }),
    ).toContain('from');
  });
});
