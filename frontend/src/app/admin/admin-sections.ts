import type { TranslationKey } from '../i18n/translations';

/** One admin management section: its route and the i18n key for its label. */
export interface AdminSection {
  readonly link: string;
  readonly key: TranslationKey;
}

/**
 * The admin management sections, in display order. Single source of truth for the
 * AdminLayout top-bar nav and the dashboard cards, so adding or renaming a section
 * is one edit here (plus its route). The "Overview" entry is intentionally not
 * listed: it is the dashboard itself and is rendered separately in the nav.
 */
export const ADMIN_SECTIONS: readonly AdminSection[] = [
  { link: '/admin/therapists', key: 'adminTherapists.nav' },
  { link: '/admin/hours', key: 'adminHours.nav' },
  { link: '/admin/blocks', key: 'adminBlocks.nav' },
  { link: '/admin/services', key: 'adminServices.nav' },
  { link: '/admin/appointments', key: 'adminAppointments.nav' },
];
