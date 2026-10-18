import { describe, expect, it } from 'vitest';
import { practiceConfig } from '@praxis-buchung/config';
import { PublicPracticeController } from './practice.controller.js';

describe('PublicPracticeController', () => {
  const controller = new PublicPracticeController();

  it('returns branding, contact and legal from the config', () => {
    const result = controller.getPractice();

    expect(result.branding).toEqual(practiceConfig.branding);
    expect(result.contact).toEqual(practiceConfig.contact);
    expect(result.legal).toEqual(practiceConfig.legal);
  });

  it('never leaks the seed (operational) data', () => {
    const result = controller.getPractice();

    expect(Object.keys(result).sort()).toEqual(['branding', 'contact', 'legal']);
    expect(result).not.toHaveProperty('seed');
  });
});
