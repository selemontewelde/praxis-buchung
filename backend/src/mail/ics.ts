/**
 * Minimal iCalendar (RFC 5545) builder for a single appointment, with no
 * dependencies. It produces one `VEVENT` wrapped in a `VCALENDAR`, suitable for
 * attaching to the booking confirmation as a `text/calendar` file so the patient
 * can add the appointment to their own calendar.
 *
 * `METHOD:PUBLISH` (not `REQUEST`) marks it as an informational event the patient
 * adds, not an RSVP invitation the practice is organising — the practice is not
 * tracking attendee responses.
 *
 * Times are emitted as UTC instants (`...Z`); the input `Date`s are already the
 * stored UTC instants, so no timezone table is needed in the file.
 */
export interface CalendarEventInput {
  /** Globally unique, stable id for the event (e.g. `<appointmentId>@<host>`). */
  uid: string;
  /** Appointment start, as a UTC instant. */
  start: Date;
  /** Appointment end, as a UTC instant. */
  end: Date;
  /** One-line title, e.g. "Manuelle Therapie bei Anna Meier". */
  summary: string;
  /** Human-readable location, e.g. "Bahnhofstrasse 1, 8001 Zürich". */
  location: string;
  /** Optional longer description. */
  description?: string;
  /** When the file was generated; defaults to now. */
  dtstamp?: Date;
}

const PRODID = '-//praxis-buchung//booking//DE';

/** Format a UTC instant as an iCalendar UTC date-time: `YYYYMMDDTHHMMSSZ`. */
function formatUtc(d: Date): string {
  const p2 = (n: number): string => String(n).padStart(2, '0');
  return (
    String(d.getUTCFullYear()).padStart(4, '0') +
    p2(d.getUTCMonth() + 1) +
    p2(d.getUTCDate()) +
    'T' +
    p2(d.getUTCHours()) +
    p2(d.getUTCMinutes()) +
    p2(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Escape a TEXT value per RFC 5545 3.3.11: backslash, semicolon and comma are
 * backslash-escaped, and newlines become the literal `\n`. Backslash is escaped
 * first so the escapes introduced afterwards are not doubled.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/**
 * Fold a content line to at most 75 octets per physical line (RFC 5545 3.1):
 * continuation lines begin with a single space. Folding is byte-aware and never
 * splits a multi-byte UTF-8 character; the first line carries 75 octets, each
 * continuation 74 (leaving room for its leading space).
 */
function foldLine(line: string): string {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line;
  const segments: string[] = [];
  let current = '';
  let limit = 75;
  for (const char of line) {
    if (Buffer.byteLength(current + char, 'utf8') > limit) {
      segments.push(current);
      current = char;
      limit = 74;
    } else {
      current += char;
    }
  }
  if (current !== '') segments.push(current);
  return segments.map((seg, i) => (i === 0 ? seg : ' ' + seg)).join('\r\n');
}

export function buildAppointmentIcs(input: CalendarEventInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    // UID is written raw (not TEXT-escaped): callers pass a token-safe value such
    // as `<appointmentId>@<host>`, with no characters that need escaping.
    `UID:${input.uid}`,
    `DTSTAMP:${formatUtc(input.dtstamp ?? new Date())}`,
    `DTSTART:${formatUtc(input.start)}`,
    `DTEND:${formatUtc(input.end)}`,
    `SUMMARY:${escapeText(input.summary)}`,
    `LOCATION:${escapeText(input.location)}`,
    ...(input.description
      ? [`DESCRIPTION:${escapeText(input.description)}`]
      : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  // CRLF between lines and a trailing CRLF, as RFC 5545 requires.
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
