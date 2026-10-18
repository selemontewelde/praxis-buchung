import { describe, expect, it } from 'vitest';
import { HealthIndicatorService } from '@nestjs/terminus';
import { Pool } from 'pg';
import { DatabaseHealthIndicator } from './database-health.indicator.js';

/**
 * Builds the indicator with a fake pg pool whose `query` behaves as given. The
 * real `HealthIndicatorService` is used (it is a pure helper with no I/O), so we
 * exercise the actual up/down mapping rather than a mock of it.
 */
function makeIndicator(query: () => Promise<unknown>): DatabaseHealthIndicator {
  const fakePool = { query } as unknown as Pool;
  return new DatabaseHealthIndicator(new HealthIndicatorService(), fakePool);
}

describe('DatabaseHealthIndicator', () => {
  it('reports "up" when the SELECT 1 query succeeds', async () => {
    const indicator = makeIndicator(async () => ({ rows: [{ value: 1 }] }));

    const result = await indicator.isHealthy('database');

    expect(result.database?.status).toBe('up');
  });

  it('reports "down" when the query throws', async () => {
    const indicator = makeIndicator(async () => {
      throw new Error('connection refused');
    });

    const result = await indicator.isHealthy('database');

    expect(result.database?.status).toBe('down');
  });
});
