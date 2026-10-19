import { Component, inject } from '@angular/core';
import { PracticeService } from '../core/practice.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'app-impressum-page',
  template: `
    <h1>{{ i18n.t('pages.impressum.title') }}</h1>

    @if (practice.legal(); as legal) {
      <h2>{{ i18n.t('impressum.responsibleHeading') }}</h2>
      <p>{{ legal.owner }}</p>
    }

    @if (practice.contact(); as c) {
      <p>{{ c.street }}<br />{{ c.postalCode }} {{ c.city }}</p>
      <h2>{{ i18n.t('impressum.contactHeading') }}</h2>
      <p>
        <a [href]="'tel:' + c.phone">{{ c.phone }}</a><br />
        <a [href]="'mailto:' + c.email">{{ c.email }}</a>
      </p>
    }

    <p class="legal-disclaimer">{{ i18n.t('legal.disclaimer') }}</p>
  `,
  styles: `
    .legal-disclaimer {
      margin-top: 2rem;
      color: var(--color-muted);
      font-style: italic;
      font-size: 0.9rem;
    }
  `,
})
export class ImpressumPage {
  protected readonly i18n = inject(I18nService);
  protected readonly practice = inject(PracticeService);
}
