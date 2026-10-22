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
    reminderHoursBefore: 24,
  },

  seed: {
    therapists: [
      {
        key: 'anna',
        firstName: 'Anna',
        lastName: 'Keller',
        title: 'PT',
        role: {
          de: 'Inhaberin & Physiotherapeutin',
          en: 'Owner & physiotherapist',
          fr: 'Propriétaire & physiothérapeute',
          it: 'Titolare e fisioterapista',
          es: 'Propietaria y fisioterapeuta',
        },
        photoUrl: 'assets/team/anna.svg',
        activeFrom: '2024-01-01',
        qualifications: ['manual-therapy-cert', 'lymph-drainage-cert'],
      },
      {
        key: 'ben',
        firstName: 'Ben',
        lastName: 'Moser',
        role: {
          de: 'Physiotherapeut',
          en: 'Physiotherapist',
          fr: 'Physiothérapeute',
          it: 'Fisioterapista',
          es: 'Fisioterapeuta',
        },
        photoUrl: 'assets/team/ben.svg',
        activeFrom: '2024-01-01',
        qualifications: ['sports-physio-cert'],
      },
    ],

    services: [
      {
        key: 'physiotherapy',
        name: 'Physiotherapie',
        durationMin: 30,
        description: {
          de: 'Individuelle Behandlung bei Beschwerden des Bewegungsapparats.',
          en: 'Individual treatment for complaints of the musculoskeletal system.',
          fr: "Traitement individuel des troubles de l'appareil locomoteur.",
          it: "Trattamento individuale dei disturbi dell'apparato locomotore.",
          es: 'Tratamiento individual de las dolencias del aparato locomotor.',
        },
      },
      {
        key: 'manual-therapy',
        name: 'Manuelle Therapie',
        durationMin: 30,
        description: {
          de: 'Gezielte Handgriffe zur Mobilisation von Gelenken und Wirbelsäule.',
          en: 'Targeted hands-on techniques to mobilise joints and the spine.',
          fr: "Techniques manuelles ciblées pour mobiliser les articulations et la colonne vertébrale.",
          it: 'Tecniche manuali mirate per mobilizzare le articolazioni e la colonna vertebrale.',
          es: 'Técnicas manuales específicas para movilizar las articulaciones y la columna vertebral.',
        },
      },
      {
        key: 'lymph-drainage',
        name: 'Lymphdrainage',
        durationMin: 45,
        description: {
          de: 'Sanfte Technik zur Entstauung bei Schwellungen und nach Operationen.',
          en: 'Gentle technique to reduce swelling and support post-surgery recovery.',
          fr: 'Technique douce pour réduire les gonflements et après une opération.',
          it: 'Tecnica delicata per ridurre i gonfiori e dopo gli interventi chirurgici.',
          es: 'Técnica suave para reducir la hinchazón y tras una operación.',
        },
      },
      {
        key: 'massage',
        name: 'Klassische Massage',
        durationMin: 20,
        description: {
          de: 'Entspannende Massage zur Lockerung verspannter Muskulatur.',
          en: 'Relaxing massage to release tense muscles.',
          fr: 'Massage relaxant pour détendre les muscles tendus.',
          it: 'Massaggio rilassante per sciogliere la muscolatura tesa.',
          es: 'Masaje relajante para aliviar la musculatura tensa.',
        },
      },
      {
        key: 'mtt',
        name: 'Medizinische Trainingstherapie',
        durationMin: 45,
        description: {
          de: 'Gerätegestütztes Training zum Muskelaufbau — findet im Geräteraum statt.',
          en: 'Equipment-based training to rebuild strength — held in the equipment room.',
          fr: "Entraînement sur appareils pour renforcer la musculature — a lieu dans la salle d'appareils.",
          it: "Allenamento con attrezzi per rinforzare la muscolatura — si svolge nella sala attrezzi.",
          es: 'Entrenamiento con aparatos para fortalecer la musculatura — en la sala de aparatos.',
        },
        // Requires the shared equipment room: both therapists can deliver it, but
        // only one MTT session can run at a time because they share the room.
        room: 'geraeteraum',
      },
    ],

    // Bookable rooms/equipment. A service may require one (see `room` above);
    // such a service can't be double-booked in that room across therapists.
    rooms: [{ key: 'geraeteraum', name: 'Geräteraum' }],

    // Credentials shown on the team page (descriptive; therapists reference these
    // by key). They do not affect which services a therapist can deliver.
    qualifications: [
      {
        key: 'manual-therapy-cert',
        name: {
          de: 'Zertifikat Manuelle Therapie',
          en: 'Manual Therapy certificate',
          fr: 'Certificat de thérapie manuelle',
          it: 'Certificato di terapia manuale',
          es: 'Certificado de terapia manual',
        },
      },
      {
        key: 'lymph-drainage-cert',
        name: {
          de: 'Ausbildung Lymphdrainage',
          en: 'Lymph Drainage training',
          fr: 'Formation en drainage lymphatique',
          it: 'Formazione in drenaggio linfatico',
          es: 'Formación en drenaje linfático',
        },
      },
      {
        key: 'sports-physio-cert',
        name: {
          de: 'Sportphysiotherapie',
          en: 'Sports Physiotherapy',
          fr: 'Physiothérapie du sport',
          it: 'Fisioterapia sportiva',
          es: 'Fisioterapia deportiva',
        },
      },
    ],

    // Back-office logins. Passwords are local dev credentials only — change
    // before any real deployment. The ADMIN manages everything; the THERAPIST
    // logins see and manage only their own hours, blocks and appointments.
    users: [
      { email: 'admin@physio-aarau.example', password: 'changeme-dev-only', role: 'ADMIN' },
      {
        email: 'anna@physio-aarau.example',
        password: 'changeme-dev-only',
        role: 'THERAPIST',
        therapist: 'anna',
      },
      {
        email: 'ben@physio-aarau.example',
        password: 'changeme-dev-only',
        role: 'THERAPIST',
        therapist: 'ben',
      },
    ],

    capabilities: [
      { therapist: 'anna', service: 'physiotherapy' },
      { therapist: 'anna', service: 'manual-therapy' },
      { therapist: 'anna', service: 'lymph-drainage' },
      { therapist: 'anna', service: 'mtt' },
      { therapist: 'ben', service: 'physiotherapy' },
      { therapist: 'ben', service: 'massage' },
      { therapist: 'ben', service: 'mtt' },
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
      // Anna: Mon–Wed, full days. Wednesday afternoon overlaps Ben, so both are
      // available then — the window where the shared Geräteraum actually matters.
      { therapist: 'anna', weekday: 'MONDAY', startMin: 480, endMin: 720 },
      { therapist: 'anna', weekday: 'MONDAY', startMin: 780, endMin: 1080 },
      { therapist: 'anna', weekday: 'TUESDAY', startMin: 480, endMin: 720 },
      { therapist: 'anna', weekday: 'TUESDAY', startMin: 780, endMin: 1080 },
      { therapist: 'anna', weekday: 'WEDNESDAY', startMin: 480, endMin: 720 },
      { therapist: 'anna', weekday: 'WEDNESDAY', startMin: 780, endMin: 1080 },
      // Ben: Wed–Fri. Wednesday afternoon (shared with Anna), then Thu/Fri mornings.
      { therapist: 'ben', weekday: 'WEDNESDAY', startMin: 780, endMin: 1080 },
      { therapist: 'ben', weekday: 'THURSDAY', startMin: 480, endMin: 720 },
      { therapist: 'ben', weekday: 'FRIDAY', startMin: 480, endMin: 720 },
    ],
  },
};

export default practiceConfig;
