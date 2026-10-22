import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PublicContentService, type PublicService } from './content.service';

const services: PublicService[] = [
  {
    id: 'physio',
    name: 'Physiotherapie',
    durationMin: 30,
    description: { de: 'DE', en: 'EN', fr: 'FR' },
  },
];

describe('PublicContentService', () => {
  let service: PublicContentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PublicContentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads services into the signal', async () => {
    const loading = service.loadServices();
    httpMock.expectOne('/api/public/services').flush(services);
    await loading;

    expect(service.services()).toEqual(services);
  });

  it('does not refetch once loaded', async () => {
    const first = service.loadServices();
    httpMock.expectOne('/api/public/services').flush(services);
    await first;

    await service.loadServices();
    httpMock.expectNone('/api/public/services');
  });

  it('keeps the list empty when the request fails', async () => {
    const loading = service.loadServices();
    httpMock
      .expectOne('/api/public/services')
      .error(new ProgressEvent('network error'));
    await loading;

    expect(service.services()).toEqual([]);
  });
});
