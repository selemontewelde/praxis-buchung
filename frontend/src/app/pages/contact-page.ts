import { Component, inject } from '@angular/core';
import { PracticeService } from '../core/practice.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'app-contact-page',
  template: `
    <h1>{{ i18n.t('pages.contact.title') }}</h1>
    @if (practice.contact(); as c) {
      <div class="contact">
        <section>
          <h2>{{ i18n.t('contact.addressHeading') }}</h2>
          <p>{{ c.street }}<br />{{ c.postalCode }} {{ c.city }}</p>
        </section>
        <section>
          <h2>{{ i18n.t('contact.phoneHeading') }}</h2>
          <p><a [href]="'tel:' + c.phone">{{ c.phone }}</a></p>
        </section>
        <section>
          <h2>{{ i18n.t('contact.emailHeading') }}</h2>
          <p><a [href]="'mailto:' + c.email">{{ c.email }}</a></p>
        </section>
      </div>
    }
  `,
  styles: `
    .contact {
      display: grid;
      gap: 1rem;
      margin-top: 1rem;
    }
    .contact h2 {
      font-size: 1rem;
      margin: 0 0 0.25rem;
    }
    .contact p {
      margin: 0;
    }
  `,
})
export class ContactPage {
  protected readonly i18n = inject(I18nService);
  protected readonly practice = inject(PracticeService);
}
