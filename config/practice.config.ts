import type { PracticeConfig } from './practice-config.types.js';

/**
 * The demo practice shipped with the template.
 *
 * To launch a real practice, edit the values below — no code changes elsewhere.
 * `branding`/`contact`/`legal` drive the public website; `seed` is the initial
 * operational data loaded into the database by `backend/prisma/seed.ts`.
 *
 * Opening/working hours are local wall-clock minutes from midnight
 * (480 = 08:00, 720 = 12:00, 780 = 13:00, 1080 = 18:00).
 */
export const practiceConfig: PracticeConfig = {
  branding: {
    name: 'Physiopraxis Aarau',
    tagline: 'Physiotherapie im Herzen von Aarau',
    logoPath: 'assets/logo.svg',
    colors: {
      primary: '#0f766e',
      accent: '#f59e0b',
    },
  },

  contact: {
    street: 'Bahnhofstrasse 12',
    postalCode: '5000',
    city: 'Aarau',
    phone: '+41 62 123 45 67',
    email: 'praxis@physio-aarau.example',
  },

  legal: {
    owner: 'Physiopraxis Aarau GmbH',
    privacyPolicyVersion: '2025-01',
  },

  timezone: 'Europe/Zurich',

  booking: {
    gridMin: 15,
    bufferMin: 10,
    minLeadMinutes: 120, // no bookings within the next 2 hours
    horizonDays: 60,
    cancellationDeadlineHours: 24,
  },

  seed: {
    therapists: [
      {
        key: 'anna',
        firstName: 'Anna',
        lastName: 'Keller',
        title: 'PT',
        roleDe: 'Inhaberin & Physiotherapeutin',
        roleEn: 'Owner & physiotherapist',
        photoUrl: 'assets/team/anna.svg',
        activeFrom: '2024-01-01',
      },
      {
        key: 'ben',
        firstName: 'Ben',
        lastName: 'Moser',
        roleDe: 'Physiotherapeut',
        roleEn: 'Physiotherapist',
        photoUrl: 'assets/team/ben.svg',
        activeFrom: '2024-01-01',
      },
    ],

    services: [
      {
        key: 'physiotherapy',
        name: 'Physiotherapie',
        durationMin: 30,
        descriptionDe:
          'Individuelle Behandlung bei Beschwerden des Bewegungsapparats.',
        descriptionEn:
          'Individual treatment for complaints of the musculoskeletal system.',
      },
      {
        key: 'manual-therapy',
        name: 'Manuelle Therapie',
        durationMin: 30,
        descriptionDe:
          'Gezielte Handgriffe zur Mobilisation von Gelenken und Wirbelsäule.',
        descriptionEn:
          'Targeted hands-on techniques to mobilise joints and the spine.',
      },
      {
        key: 'lymph-drainage',
        name: 'Lymphdrainage',
        durationMin: 45,
        descriptionDe:
          'Sanfte Technik zur Entstauung bei Schwellungen und nach Operationen.',
        descriptionEn:
          'Gentle technique to reduce swelling and support post-surgery recovery.',
      },
      {
        key: 'massage',
        name: 'Klassische Massage',
        durationMin: 20,
        descriptionDe: 'Entspannende Massage zur Lockerung verspannter Muskulatur.',
        descriptionEn: 'Relaxing massage to release tense muscles.',
      },
    ],

    capabilities: [
      { therapist: 'anna', service: 'physiotherapy' },
      { therapist: 'anna', service: 'manual-therapy' },
      { therapist: 'anna', service: 'lymph-drainage' },
      { therapist: 'ben', service: 'physiotherapy' },
      { therapist: 'ben', service: 'massage' },
    ],

    // Mon–Fri, 08:00–12:00 and 13:00–18:00.
    openingHours: [
      { weekday: 'MONDAY', startMin: 480, endMin: 720 },
      { weekday: 'MONDAY', startMin: 780, endMin: 1080 },
      { weekday: 'TUESDAY', startMin: 480, endMin: 720 },
      { weekday: 'TUESDAY', startMin: 780, endMin: 1080 },
      { weekday: 'WEDNESDAY', startMin: 480, endMin: 720 },
      { weekday: 'WEDNESDAY', startMin: 780, endMin: 1080 },
      { weekday: 'THURSDAY', startMin: 480, endMin: 720 },
      { weekday: 'THURSDAY', startMin: 780, endMin: 1080 },
      { weekday: 'FRIDAY', startMin: 480, endMin: 720 },
      { weekday: 'FRIDAY', startMin: 780, endMin: 1080 },
    ],

    workingHours: [
      // Anna: Mon–Wed, full days.
      { therapist: 'anna', weekday: 'MONDAY', startMin: 480, endMin: 720 },
      { therapist: 'anna', weekday: 'MONDAY', startMin: 780, endMin: 1080 },
      { therapist: 'anna', weekday: 'TUESDAY', startMin: 480, endMin: 720 },
      { therapist: 'anna', weekday: 'TUESDAY', startMin: 780, endMin: 1080 },
      { therapist: 'anna', weekday: 'WEDNESDAY', startMin: 480, endMin: 720 },
      // Ben: Wed–Fri, mornings only.
      { therapist: 'ben', weekday: 'WEDNESDAY', startMin: 780, endMin: 1080 },
      { therapist: 'ben', weekday: 'THURSDAY', startMin: 480, endMin: 720 },
      { therapist: 'ben', weekday: 'FRIDAY', startMin: 480, endMin: 720 },
    ],
  },
};

export default practiceConfig;
