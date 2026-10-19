import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PracticeService, type PublicPractice } from './practice.service';

const samplePractice: PublicPractice = {
  branding: {
    name: 'Physiopraxis Test',
    logoPath: 'assets/logo.svg',
    colors: { primary: '#123456', accent: '#abcdef' },
  },
  contact: {
    street: 'Teststrasse 1',
    postalCode: '5000',
    city: 'Aarau',
    phone: '+41 00 000 00 00',
    email: 'test@example.com',
  },
  legal: { owner: 'Test GmbH', privacyPolicyVersion: '2025-01' },
  timezone: 'Europe/Zurich',
};

describe('PracticeService', () => {
  let service: PracticeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PracticeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads the practice and exposes it as signals', async () => {
    const loading = service.load();
    httpMock.expectOne('/api/public/practice').flush(samplePractice);
    await loading;

    expect(service.practice()).toEqual(samplePractice);
    expect(service.branding()?.name).toBe('Physiopraxis Test');
  });

  it('applies branding colours as CSS custom properties', async () => {
    const loading = service.load();
    httpMock.expectOne('/api/public/practice').flush(samplePractice);
    await loading;

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary')).toBe('#123456');
    expect(root.style.getPropertyValue('--color-accent')).toBe('#abcdef');
  });

  it('does not throw when the backend is unreachable', async () => {
    const loading = service.load();
    httpMock
      .expectOne('/api/public/practice')
      .error(new ProgressEvent('network error'));
    await expect(loading).resolves.toBeUndefined();
    expect(service.practice()).toBeNull();
  });
});
