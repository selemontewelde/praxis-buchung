import pino from 'pino';
import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { buildLoggerOptions } from './logging.options.js';

/**
 * Run one log record through a real pino instance configured with our options
 * and return the raw line it wrote. This tests observable output (the privacy
 * guarantee), not the shape of the options object.
 */
function logLine(record: Record<string, unknown>): string {
  let out = '';
  const sink = new Writable({
    write(chunk, _enc, cb) {
      out += chunk.toString();
      cb();
    },
  });
  // A non-production env keeps pino writing raw JSON to our sink (no worker
  // thread transport), so the line is captured synchronously.
  const logger = pino(buildLoggerOptions('test'), sink);
  logger.info(record, 'message');
  return out;
}

describe('buildLoggerOptions redaction', () => {
  it('redacts personal data and secrets from the output', () => {
    const line = logLine({
      // The field names the app actually uses on appointment records / DTOs.
      patientName: 'Alex Patient',
      patientEmail: 'patient@example.com',
      patientPhone: '+41 79 123 45 67',
      password: 'super-secret',
      // One level deep, e.g. a logged appointment object.
      appointment: { patientEmail: 'nested@example.com' },
      req: {
        headers: {
          authorization: 'Bearer abc.def.ghi',
          cookie: 'session=xyz',
        },
      },
    });

    for (const secret of [
      'Alex Patient',
      'patient@example.com',
      '+41 79 123 45 67',
      'super-secret',
      'nested@example.com',
      'Bearer abc.def.ghi',
      'session=xyz',
    ]) {
      expect(line).not.toContain(secret);
    }
    expect(line).toContain('[Redacted]');
  });

  it('keeps non-sensitive fields intact', () => {
    const line = logLine({ appointmentId: 'appt-42', durationMin: 30 });
    expect(line).toContain('appt-42');
    expect(line).toContain('durationMin');
  });
});

describe('buildLoggerOptions level', () => {
  it('takes the level from LOG_LEVEL', () => {
    const prev = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'debug';
    try {
      expect(buildLoggerOptions('production').level).toBe('debug');
    } finally {
      if (prev === undefined) delete process.env.LOG_LEVEL;
      else process.env.LOG_LEVEL = prev;
    }
  });

  it('defaults to info when LOG_LEVEL is unset', () => {
    const prev = process.env.LOG_LEVEL;
    delete process.env.LOG_LEVEL;
    try {
      expect(buildLoggerOptions('production').level).toBe('info');
    } finally {
      if (prev !== undefined) process.env.LOG_LEVEL = prev;
    }
  });
});

describe('buildLoggerOptions transport', () => {
  it('pretty-prints in development', () => {
    const transport = buildLoggerOptions('development').transport as
      | { target?: string }
      | undefined;
    expect(transport?.target).toBe('pino-pretty');
  });

  it('emits raw JSON (no transport) outside development', () => {
    expect(buildLoggerOptions('production').transport).toBeUndefined();
    expect(buildLoggerOptions('test').transport).toBeUndefined();
  });
});
