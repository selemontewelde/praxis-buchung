import { Injectable } from '@nestjs/common';
import { practiceConfig } from '@praxis-buchung/config';
import { DateTime } from 'luxon';
import {
  createTransport,
  type SendMailOptions,
  type Transporter,
  type TransportOptions,
} from 'nodemailer';
import { buildAppointmentIcs } from './ics.js';

/**
 * Builds the SMTP transport options from the environment.
 *
 * - Local dev (Mailpit): SMTP_HOST/SMTP_PORT only, no credentials, no TLS — the
 *   default and unchanged.
 * - Production: set SMTP_USER + SMTP_PASS to authenticate. SMTP_SECURE=true uses
 *   implicit TLS (port 465); otherwise, when credentials are present, STARTTLS is
 *   required (port 587) so the password never travels in clear.
 */
export function smtpOptionsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): TransportOptions {
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const secure = env.SMTP_SECURE === 'true';
  const base = {
    host: env.SMTP_HOST ?? 'localhost',
    port: Number(env.SMTP_PORT ?? '1025'),
    secure,
  };
  // Authenticate only when both are present (the `&&` narrows them to string);
  // then require TLS so the password never travels in clear — STARTTLS on 587,
  // or implicit TLS when SMTP_SECURE=true (465).
  if (user && pass) {
    return { ...base, auth: { user, pass }, requireTLS: !secure } as TransportOptions;
  }
  return base as TransportOptions;
}

export interface BookingEmailData {
  to: string;
  patientName: string;
  serviceName: string;
  therapistName: string;
  startAt: Date;
  endAt: Date;
  appointmentId: string;
  cancelUrl: string;
}

export interface CancellationEmailData {
  to: string;
  patientName: string;
  serviceName: string;
  therapistName: string;
  startAt: Date;
}

export type ReminderEmailData = CancellationEmailData;

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
  private readonly transporter: Transporter = createTransport(
    smtpOptionsFromEnv(),
  );
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
    // Attach an iCalendar file so the patient can add the appointment to their
    // own calendar. The UID ties the event to the appointment; the location is
    // the practice address from the config.
    const contact = practiceConfig.contact;
    const ics = buildAppointmentIcs({
      uid: `${data.appointmentId}@praxis-buchung`,
      start: data.startAt,
      end: data.endAt,
      summary: `${data.serviceName} bei ${data.therapistName}`,
      location: `${contact.street}, ${contact.postalCode} ${contact.city}`,
    });
    await this.send(data.to, `Terminbestätigung – ${practice}`, body, [
      {
        filename: 'termin.ics',
        content: ics,
        contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
      },
    ]);
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

  async sendReminder(data: ReminderEmailData): Promise<void> {
    const practice = practiceConfig.branding.name;
    // Deliberately no cancellation link: the reminder goes out when the online
    // cancellation window has closed, so patients are asked to call instead.
    const body =
      `Guten Tag ${data.patientName}\n\n` +
      `Erinnerung an Ihren morgigen Termin:\n` +
      `${data.serviceName} bei ${data.therapistName}\n` +
      `${this.formatWhen(data.startAt)}\n\n` +
      `Für kurzfristige Änderungen rufen Sie uns bitte an: ${practiceConfig.contact.phone}\n\n` +
      `Freundliche Grüsse\n${practice}`;
    await this.send(data.to, `Terminerinnerung – ${practice}`, body);
  }

  private formatWhen(startAt: Date): string {
    return DateTime.fromJSDate(startAt, { zone: practiceConfig.timezone })
      .setLocale('de-CH')
      .toFormat("cccc, d. LLLL yyyy, HH:mm 'Uhr'");
  }

  private async send(
    to: string,
    subject: string,
    text: string,
    attachments?: SendMailOptions['attachments'],
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      text,
      attachments,
    });
  }
}
