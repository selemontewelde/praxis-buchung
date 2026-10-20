import { describe, expect, it } from 'vitest';
import { smtpOptionsFromEnv } from './mail.service.js';

// The options object is typed as nodemailer's opaque TransportOptions; read it
// back as a record to assert the fields.
function opts(env: NodeJS.ProcessEnv): Record<string, unknown> {
  return smtpOptionsFromEnv(env) as unknown as Record<string, unknown>;
}

describe('smtpOptionsFromEnv', () => {
  it('local Mailpit (no credentials): no auth, no TLS', () => {
    const o = opts({ SMTP_HOST: 'mailpit', SMTP_PORT: '1025' });
    expect(o).toMatchObject({ host: 'mailpit', port: 1025, secure: false });
    expect(o.auth).toBeUndefined();
    expect(o.requireTLS).toBeUndefined();
  });

  it('falls back to localhost:1025 when host/port are unset', () => {
    const o = opts({});
    expect(o).toMatchObject({ host: 'localhost', port: 1025 });
  });

  it('real provider on 587: authenticates and requires STARTTLS', () => {
    const o = opts({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'apikey',
      SMTP_PASS: 'secret',
    });
    expect(o).toMatchObject({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: { user: 'apikey', pass: 'secret' },
      requireTLS: true,
    });
  });

  it('SMTP_SECURE=true uses implicit TLS (no separate STARTTLS requirement)', () => {
    const o = opts({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'apikey',
      SMTP_PASS: 'secret',
      SMTP_SECURE: 'true',
    });
    expect(o).toMatchObject({ port: 465, secure: true, requireTLS: false });
  });

  it('ignores a username without a password (stays unauthenticated)', () => {
    const o = opts({ SMTP_HOST: 'mailpit', SMTP_USER: 'u' });
    expect(o.auth).toBeUndefined();
  });

  it('ignores a password without a username (stays unauthenticated)', () => {
    const o = opts({ SMTP_HOST: 'mailpit', SMTP_PASS: 'p' });
    expect(o.auth).toBeUndefined();
  });
});
