import { describe, expect, it, vi } from 'vitest';

const { sendMail } = vi.hoisted(() => ({
  sendMail: vi.fn().mockResolvedValue({}),
}));
vi.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail }),
}));

const { MailService } = await import('./mail.service.js');

describe('MailService', () => {
  it('sends a booking confirmation with the details and cancel link', async () => {
    sendMail.mockClear();
    await new MailService().sendBookingConfirmation({
      to: 'pat@example.com',
      patientName: 'Pat',
      serviceName: 'Physiotherapie',
      therapistName: 'Anna Keller',
      startAt: new Date('2026-06-15T06:00:00.000Z'),
      cancelUrl: 'http://localhost:4200/stornieren?token=abc',
    });

    expect(sendMail).toHaveBeenCalledOnce();
    const mail = sendMail.mock.calls[0][0] as {
      to: string;
      subject: string;
      text: string;
    };
    expect(mail.to).toBe('pat@example.com');
    expect(mail.text).toContain('Physiotherapie');
    expect(mail.text).toContain('Anna Keller');
    expect(mail.text).toContain('http://localhost:4200/stornieren?token=abc');
  });

  it('sends a cancellation confirmation', async () => {
    sendMail.mockClear();
    await new MailService().sendCancellationConfirmation({
      to: 'pat@example.com',
      patientName: 'Pat',
      serviceName: 'Physiotherapie',
      therapistName: 'Anna Keller',
      startAt: new Date('2026-06-15T06:00:00.000Z'),
    });

    expect(sendMail).toHaveBeenCalledOnce();
    const mail = sendMail.mock.calls[0][0] as { subject: string };
    expect(mail.subject).toContain('Terminabsage');
  });
});
