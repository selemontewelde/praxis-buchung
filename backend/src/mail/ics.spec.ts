import { describe, expect, it } from 'vitest';
import { buildAppointmentIcs, type CalendarEventInput } from './ics.js';

// A worked example, independent of the implementation: a 50-minute appointment
// on 15 March 2026, 08:30–09:20 UTC.
const base: CalendarEventInput = {
  uid: 'appt-123@praxis-buchung',
  start: new Date('2026-03-15T08:30:00Z'),
  end: new Date('2026-03-15T09:20:00Z'),
  summary: 'Manuelle Therapie bei Anna Meier',
  location: 'Bahnhofstrasse 1, 8001 Zürich',
  dtstamp: new Date('2026-03-01T12:00:00Z'),
};

// Split a folded iCalendar string back into logical lines: a CRLF followed by a
// single space is a fold continuation (RFC 5545 3.1), so unfold before asserting.
function logicalLines(ics: string): string[] {
  // Drop the standard trailing CRLF so the last line is the final content line,
  // then unfold.
  return ics
    .replace(/\r\n$/, '')
    .replace(/\r\n[ \t]/g, '')
    .split('\r\n');
}

describe('buildAppointmentIcs', () => {
  it('wraps exactly one VEVENT in a VCALENDAR', () => {
    const lines = logicalLines(buildAppointmentIcs(base));
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain('VERSION:2.0');
    expect(lines.some((l) => l.startsWith('PRODID:'))).toBe(true);
    expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1);
    expect(lines.filter((l) => l === 'END:VEVENT')).toHaveLength(1);
    expect(lines.at(-1)).toBe('END:VCALENDAR');
  });

  it('writes DTSTART/DTEND/DTSTAMP as UTC instants (YYYYMMDDTHHMMSSZ)', () => {
    const lines = logicalLines(buildAppointmentIcs(base));
    expect(lines).toContain('DTSTART:20260315T083000Z');
    expect(lines).toContain('DTEND:20260315T092000Z');
    expect(lines).toContain('DTSTAMP:20260301T120000Z');
  });

  it('carries the summary, location and a stable UID', () => {
    const lines = logicalLines(buildAppointmentIcs(base));
    expect(lines).toContain('SUMMARY:Manuelle Therapie bei Anna Meier');
    expect(lines).toContain('LOCATION:Bahnhofstrasse 1\\, 8001 Zürich');
    expect(lines).toContain('UID:appt-123@praxis-buchung');
  });

  it('escapes commas, semicolons, backslashes and newlines in text values', () => {
    const lines = logicalLines(
      buildAppointmentIcs({
        ...base,
        summary: 'A; B, C\\D',
        description: 'line1\nline2',
      }),
    );
    expect(lines).toContain('SUMMARY:A\\; B\\, C\\\\D');
    expect(lines).toContain('DESCRIPTION:line1\\nline2');
  });

  it('folds lines longer than 75 octets onto continuation lines', () => {
    const ics = buildAppointmentIcs({
      ...base,
      description: 'x'.repeat(200),
    });
    // At least one physical line is folded (CRLF + leading space), and no raw
    // physical line exceeds 75 octets.
    expect(/\r\n[ \t]/.test(ics)).toBe(true);
    for (const physical of ics.split('\r\n')) {
      expect(Buffer.byteLength(physical, 'utf8')).toBeLessThanOrEqual(75);
    }
    // Unfolding restores the full description.
    expect(logicalLines(ics)).toContain(`DESCRIPTION:${'x'.repeat(200)}`);
  });

  it('uses CRLF line endings throughout', () => {
    const ics = buildAppointmentIcs(base);
    expect(ics).toContain('\r\n');
    // No bare LF that is not preceded by CR.
    expect(/[^\r]\n/.test(ics)).toBe(false);
    expect(ics.endsWith('\r\n')).toBe(true);
  });
});
