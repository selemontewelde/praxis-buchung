import { Component, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';

// Placeholder — Datenschutz (revDSG) content arrives in issue #10.
@Component({
  selector: 'app-privacy-page',
  template: `<h1>{{ i18n.t('pages.privacy.title') }}</h1>`,
})
export class PrivacyPage {
  protected readonly i18n = inject(I18nService);
}
