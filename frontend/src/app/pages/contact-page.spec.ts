import { TestBed } from '@angular/core/testing';
import { PracticeService } from '../core/practice.service';
import { ContactPage } from './contact-page';

describe('ContactPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PracticeService,
          useValue: {
            contact: () => ({
              street: 'Bahnhofstrasse 12',
              postalCode: '5000',
              city: 'Aarau',
              phone: '+41 62 123 45 67',
              email: 'praxis@physio-aarau.example',
            }),
          },
        },
      ],
    });
  });

  it('shows the address and contact details from the config', () => {
    const fixture = TestBed.createComponent(ContactPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Bahnhofstrasse 12');
    expect(el.textContent).toContain('5000 Aarau');
    expect(el.querySelector('a[href="tel:+41 62 123 45 67"]')).toBeTruthy();
    expect(
      el.querySelector('a[href="mailto:praxis@physio-aarau.example"]'),
    ).toBeTruthy();
  });
});
