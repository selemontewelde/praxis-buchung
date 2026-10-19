import { Injectable } from '@nestjs/common';
import { practiceConfig } from '@praxis-buchung/config';
import { DateTime } from 'luxon';
import { createTransport, type Transporter } from 'nodemailer';

export interface BookingEmailData {
  to: string;
  patientName: string;
  serviceName: string;
  therapistName: string;
  startAt: Date;
  cancelUrl: string;
}

export interface CancellationEmailData {
  to: string;
  patientName: string;
  serviceName: string;
  therapistName: string;
  startAt: Date;
}

/**
 * Sends patient emails over SMTP (Mailpit locally, real SMTP via env in
 * staging/production). Plain-text German emails — the patient's language isn't
 * captured at booking, and the practice's market is German-speaking.
 *
 * Callers treat sending as best-effort: a failure here must not roll back a
 * booking or cancellation.
 */
@Injectable()
export class MailService {
  private readonly transporter: Transporter = createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? '1025'),
    secure: false,
  });
  private readonly from = process.env.MAIL_FROM ?? 'praxis@example.com';

  async sendBookingConfirmation(data: BookingEmailData): Promise<void> {
    const practice = practiceConfig.branding.name;
    const body =
      `Guten Tag ${data.patientName}\n\n` +
      `Ihr Termin ist bestätigt:\n` +
      `${data.serviceName} bei ${data.therapistName}\n` +
      `${this.formatWhen(data.startAt)}\n\n` +
      `Möchten Sie den Termin absagen? Nutzen Sie diesen Link:\n${data.cancelUrl}\n\n` +
      `Freundliche Grüsse\n${practice}`;
    await this.send(data.to, `Terminbestätigung – ${practice}`, body);
  }

  async sendCancellationConfirmation(data: CancellationEmailData): Promise<void> {
    const practice = practiceConfig.branding.name;
    const body =
      `Guten Tag ${data.patientName}\n\n` +
      `Ihr Termin wurde storniert:\n` +
      `${data.serviceName} bei ${data.therapistName}\n` +
      `${this.formatWhen(data.startAt)}\n\n` +
      `Freundliche Grüsse\n${practice}`;
    await this.send(data.to, `Terminabsage – ${practice}`, body);
  }

  private formatWhen(startAt: Date): string {
    return DateTime.fromJSDate(startAt, { zone: practiceConfig.timezone })
      .setLocale('de-CH')
      .toFormat("cccc, d. LLLL yyyy, HH:mm 'Uhr'");
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, subject, text });
  }
}
