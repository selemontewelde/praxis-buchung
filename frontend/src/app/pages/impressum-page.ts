import { Component, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';

// Placeholder — Impressum content (from config) arrives in issue #10.
@Component({
  selector: 'app-impressum-page',
  template: `<h1>{{ i18n.t('pages.impressum.title') }}</h1>`,
})
export class ImpressumPage {
  protected readonly i18n = inject(I18nService);
}
