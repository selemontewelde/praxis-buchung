import type { LoggerOptions } from 'pino';

/**
 * Fields that must never reach the logs. This project is data-minimal, so we
 * scrub personal data and credentials at the top level and one level deep
 * (pino's `*` wildcard matches a single level only), plus the request/response
 * headers that pino-http logs automatically. We list both the field names the
 * app actually uses on appointment records and DTOs
 * (`patientName`/`patientEmail`/`patientPhone`) and the bare forms, so a logged
 * appointment object is covered. Note: redaction only scrubs structured object
 * paths, never substrings inside a message string — do not interpolate PII into
 * a log message.
 */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'patientName',
  'patientEmail',
  'patientPhone',
  'email',
  'name',
  'phone',
  'password',
  '*.patientName',
  '*.patientEmail',
  '*.patientPhone',
  '*.email',
  '*.name',
  '*.phone',
  '*.password',
];

/**
 * Builds the pino options for the app logger from the environment: the format
 * is chosen by `env` (NODE_ENV) and the level by LOG_LEVEL (default info). It
 * holds no state, so the spec can test it by running real log records through a
 * pino instance built from its output (see the spec).
 */
export function buildLoggerOptions(env: string | undefined): LoggerOptions {
  return {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: { paths: REDACT_PATHS, censor: '[Redacted]' },
    // Human-readable, colourised output for local development; everywhere else
    // (staging, production, tests) pino writes raw JSON for log aggregation.
    ...(env === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
          },
        }
      : {}),
  };
}
