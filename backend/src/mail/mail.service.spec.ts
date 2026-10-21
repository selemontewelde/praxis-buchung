import { describe, expect, it, vi } from 'vitest';

const { sendMail } = vi.hoisted(() => ({
  sendMail: vi.fn().mockResolvedValue({}),
}));
vi.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail }),
}));

const { MailService } = await import('./mail.service.js');

describe('MailService', () => {
  it('sends a booking confirmation with the details, cancel link and an .ics attachment', async () => {
    sendMail.mockClear();
    await new MailService().sendBookingConfirmation({
      to: 'pat@example.com',
      patientName: 'Pat',
      serviceName: 'Physiotherapie',
      therapistName: 'Anna Keller',
      startAt: new Date('2026-06-15T06:00:00.000Z'),
      endAt: new Date('2026-06-15T06:50:00.000Z'),
      appointmentId: 'appt-1',
      cancelUrl: 'http://localhost:4200/stornieren?token=abc',
    });

    expect(sendMail).toHaveBeenCalledOnce();
    const mail = sendMail.mock.calls[0][0] as {
      to: string;
      subject: string;
      text: string;
      attachments?: { filename?: string; contentType?: string; content?: string }[];
    };
    expect(mail.to).toBe('pat@example.com');
    expect(mail.text).toContain('Physiotherapie');
    expect(mail.text).toContain('Anna Keller');
    expect(mail.text).toContain('http://localhost:4200/stornieren?token=abc');
    // A calendar invite is attached, carrying this appointment's event.
    const ics = mail.attachments?.[0];
    expect(ics?.filename).toBe('termin.ics');
    expect(ics?.contentType).toContain('text/calendar');
    expect(ics?.content).toContain('BEGIN:VEVENT');
    expect(ics?.content).toContain('DTSTART:20260615T060000Z');
    expect(ics?.content).toContain('DTEND:20260615T065000Z');
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

  it('sends a reminder with no cancel link and a phone number', async () => {
    sendMail.mockClear();
    await new MailService().sendReminder({
      to: 'pat@example.com',
      patientName: 'Pat',
      serviceName: 'Physiotherapie',
      therapistName: 'Anna Keller',
      startAt: new Date('2026-06-20T08:00:00.000Z'),
    });

    expect(sendMail).toHaveBeenCalledOnce();
    const mail = sendMail.mock.calls[0][0] as { subject: string; text: string };
    expect(mail.subject).toContain('Terminerinnerung');
    expect(mail.text).not.toContain('/stornieren');
    expect(mail.text).toMatch(/\+41/); // practice phone for short-notice changes
  });
});
