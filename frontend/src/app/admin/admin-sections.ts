import type { AdminRole } from './admin-auth.service';
import type { TranslationKey } from '../i18n/translations';

/** One admin management section: its route, label key, and who may see it. */
export interface AdminSection {
  readonly link: string;
  readonly key: TranslationKey;
  /** Only an ADMIN sees this section (a THERAPIST manages just their own data). */
  readonly adminOnly?: boolean;
}

/**
 * The admin management sections, in display order. Single source of truth for the
 * AdminLayout top-bar nav and the dashboard cards, so adding or renaming a section
 * is one edit here (plus its route). The "Overview" entry is intentionally not
 * listed: it is the dashboard itself and is rendered separately in the nav.
 */
export const ADMIN_SECTIONS: readonly AdminSection[] = [
  { link: '/admin/therapists', key: 'adminTherapists.nav', adminOnly: true },
  { link: '/admin/users', key: 'adminUsers.nav', adminOnly: true },
  { link: '/admin/hours', key: 'adminHours.nav' },
  { link: '/admin/blocks', key: 'adminBlocks.nav' },
  { link: '/admin/services', key: 'adminServices.nav', adminOnly: true },
  { link: '/admin/appointments', key: 'adminAppointments.nav' },
];

/**
 * The sections visible to a role: an ADMIN sees all; a THERAPIST sees only the
 * shared ones (their own hours, blocks and appointments). This is UX only — the
 * backend already rejects an admin-only action by a THERAPIST.
 */
export function visibleSections(role: AdminRole): readonly AdminSection[] {
  if (role === 'ADMIN') {
    return ADMIN_SECTIONS;
  }
  return ADMIN_SECTIONS.filter((section) => section.adminOnly !== true);
}
