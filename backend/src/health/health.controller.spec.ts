import { describe, expect, it, vi } from 'vitest';
import type {
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import type { PrismaService } from '../prisma/prisma.service.js';

/**
 * Wiring test for the /health controller. The actual database ping is Terminus'
 * `PrismaHealthIndicator` (library code, not tested here) and needs no real DB in
 * CI. We verify only what this controller authors: it registers a single
 * "database" indicator that pings through the shared PrismaService with a timeout,
 * and returns whatever `HealthCheckService.check` resolves to.
 */
describe('HealthController', () => {
  it('checks the database via PrismaHealthIndicator with a timeout', async () => {
    const withTimeout = vi.fn().mockReturnValue('database-indicator');
    const pingCheck = vi.fn().mockReturnValue({ withTimeout });
    const db = { pingCheck } as unknown as PrismaHealthIndicator;

    const expected = { status: 'ok' };
    const check = vi.fn().mockResolvedValue(expected);
    const health = { check } as unknown as HealthCheckService;

    const prisma = { marker: 'prisma' } as unknown as PrismaService;

    const controller = new HealthController(health, db, prisma);
    const result = await controller.check();

    // The controller passes exactly one indicator function to health.check.
    expect(check).toHaveBeenCalledOnce();
    const indicators = check.mock.calls[0][0] as Array<() => unknown>;
    expect(indicators).toHaveLength(1);

    // Invoking it drives the ping against the shared Prisma client with a timeout.
    indicators[0]();
    expect(pingCheck).toHaveBeenCalledWith('database', prisma);
    expect(withTimeout).toHaveBeenCalledWith(3000);

    expect(result).toBe(expected);
  });
});
