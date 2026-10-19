import { Component, inject } from '@angular/core';
import { PracticeService } from '../core/practice.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'app-privacy-page',
  template: `
    <h1>{{ i18n.t('pages.privacy.title') }}</h1>
    <p>{{ i18n.t('privacy.intro') }}</p>

    <h2>{{ i18n.t('privacy.dataHeading') }}</h2>
    <p>{{ i18n.t('privacy.data') }}</p>

    <h2>{{ i18n.t('privacy.purposeHeading') }}</h2>
    <p>{{ i18n.t('privacy.purpose') }}</p>

    <h2>{{ i18n.t('privacy.retentionHeading') }}</h2>
    <p>{{ i18n.t('privacy.retention') }}</p>

    <h2>{{ i18n.t('privacy.rightsHeading') }}</h2>
    <p>{{ i18n.t('privacy.rights') }}</p>

    <h2>{{ i18n.t('privacy.contactHeading') }}</h2>
    @if (practice.contact(); as c) {
      <p><a [href]="'mailto:' + c.email">{{ c.email }}</a></p>
    }

    @if (practice.legal(); as legal) {
      <p class="version">
        {{ i18n.t('privacy.version') }}: {{ legal.privacyPolicyVersion }}
      </p>
    }

    <p class="legal-disclaimer">{{ i18n.t('legal.disclaimer') }}</p>
  `,
  styles: `
    .version {
      color: var(--color-muted);
      font-size: 0.9rem;
    }
    .legal-disclaimer {
      margin-top: 2rem;
      color: var(--color-muted);
      font-style: italic;
      font-size: 0.9rem;
    }
  `,
})
export class PrivacyPage {
  protected readonly i18n = inject(I18nService);
  protected readonly practice = inject(PracticeService);
}
