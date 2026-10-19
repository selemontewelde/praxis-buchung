import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CancellationPage } from './cancellation-page';

const ROUTE_STUB = {
  snapshot: { queryParamMap: { get: () => 'tok' } },
};

async function setup(view: {
  serviceName: string;
  therapistName: string;
  startAt: string;
  status: 'BOOKED' | 'CANCELLED';
  cancellable: boolean;
}) {
  const fixture = TestBed.createComponent(CancellationPage);
  const httpMock = TestBed.inject(HttpTestingController);
  httpMock.expectOne('/api/public/cancellations/tok').flush(view);
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, httpMock };
}

describe('CancellationPage', () => {
  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    TestBed.configureTestingModule({
      imports: [CancellationPage],
      providers: [
        { provide: ActivatedRoute, useValue: ROUTE_STUB },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('offers cancellation and confirms it', async () => {
    const { fixture, httpMock } = await setup({
      serviceName: 'Physiotherapie',
      therapistName: 'Anna Keller',
      startAt: '2026-06-20T08:00:00.000Z',
      status: 'BOOKED',
      cancellable: true,
    });
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button');
    expect(button).toBeTruthy();

    button?.dispatchEvent(new Event('click'));
    httpMock.expectOne('/api/public/cancellations/tok').flush({
      status: 'CANCELLED',
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.textContent).toContain('storniert');
    httpMock.verify();
  });

  it('shows a "please call" message past the deadline', async () => {
    const { fixture, httpMock } = await setup({
      serviceName: 'Physiotherapie',
      therapistName: 'Anna Keller',
      startAt: '2026-06-20T08:00:00.000Z',
      status: 'BOOKED',
      cancellable: false,
    });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('button')).toBeNull();
    expect(el.textContent).toContain('rufen Sie uns an');
    httpMock.verify();
  });
});
