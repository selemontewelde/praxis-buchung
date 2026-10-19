import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateBookingDto } from './create-booking.dto.js';

function valid(): Record<string, unknown> {
  return {
    serviceId: 'physio',
    therapistId: 'anna',
    startAt: '2026-06-15T06:00:00.000Z',
    patient: { name: 'Pat', email: 'pat@example.com', phone: '+41 00 000 00 00' },
    consent: { policyVersion: '2025-01', accepted: true },
  };
}

async function errorProps(obj: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(CreateBookingDto, obj), {
    whitelist: true,
  });
  return errors.map((e) => e.property);
}

describe('CreateBookingDto', () => {
  it('accepts a valid booking', async () => {
    expect(await errorProps(valid())).toEqual([]);
  });

  it('rejects consent that was not accepted', async () => {
    const dto = valid();
    (dto.consent as Record<string, unknown>).accepted = false;
    expect(await errorProps(dto)).toContain('consent');
  });

  it('rejects an invalid patient email', async () => {
    const dto = valid();
    (dto.patient as Record<string, unknown>).email = 'not-an-email';
    expect(await errorProps(dto)).toContain('patient');
  });

  it('rejects a non-ISO startAt', async () => {
    const dto = valid();
    dto.startAt = 'not-a-date';
    expect(await errorProps(dto)).toContain('startAt');
  });
});
