import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

/**
 * Security hardening (issue #27) against a real app: security headers are set,
 * and the booking endpoint is rate limited. Boots the full AppModule (so the
 * global ThrottlerGuard and the configured middleware are active), which needs a
 * database — runs via `npm run test:int` (skipped in the unit run).
 */
const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)('Security hardening (real app)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets standard security headers (helmet)', async () => {
    const res = await request(app.getHttpServer()).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    // SAMEORIGIN is helmet's value (this test hits the backend directly). In
    // production the Caddy edge replaces it with the stricter DENY.
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('rate limits the booking endpoint (6th request in a minute → 429)', async () => {
    const server = app.getHttpServer();
    const body = {
      serviceId: 'nope',
      therapistId: 'nope',
      startAt: '2026-06-15T06:00:00.000Z',
      patient: { name: 'Pat', email: 'pat@example.com', phone: '+41 00 000 00 00' },
      consent: { policyVersion: '2025-01', accepted: true },
    };

    // The limit is 5/min. The first five are allowed through (they resolve to a
    // 4xx since the service/therapist don't exist — that's fine, they still
    // count); the sixth must be rejected by the throttler with 429.
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      // Sequential on purpose: the throttler counts one request at a time.
      const res = await request(server).post('/api/public/bookings').send(body);
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 5)).not.toContain(429);
    expect(statuses[5]).toBe(429);
  });
});
