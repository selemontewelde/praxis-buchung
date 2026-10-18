import { Component, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';

// Placeholder — real services list (from the public API) arrives in issue #9.
@Component({
  selector: 'app-services-page',
  template: `<h1>{{ i18n.t('pages.services.title') }}</h1>`,
})
export class ServicesPage {
  protected readonly i18n = inject(I18nService);
}
