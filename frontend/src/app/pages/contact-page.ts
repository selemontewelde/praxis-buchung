import { Component, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';

// Placeholder — address/contact details (from config) arrive in issue #10.
@Component({
  selector: 'app-contact-page',
  template: `<h1>{{ i18n.t('pages.contact.title') }}</h1>`,
})
export class ContactPage {
  protected readonly i18n = inject(I18nService);
}
