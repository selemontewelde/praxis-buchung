import { ADMIN_SECTIONS, visibleSections } from './admin-sections';

describe('visibleSections', () => {
  it('shows every section to an ADMIN', () => {
    expect(visibleSections('ADMIN')).toEqual(ADMIN_SECTIONS);
  });

  it('hides admin-only sections from a THERAPIST', () => {
    const links = visibleSections('THERAPIST').map((s) => s.link);
    expect(links).toEqual(['/admin/hours', '/admin/blocks', '/admin/appointments']);
    expect(links).not.toContain('/admin/therapists');
    expect(links).not.toContain('/admin/services');
  });
});
