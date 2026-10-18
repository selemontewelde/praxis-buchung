import { Component, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';

// Placeholder — real start-page content (hero, intro) arrives in issue #9.
@Component({
  selector: 'app-start-page',
  template: `<h1>{{ i18n.t('pages.home.title') }}</h1>`,
})
export class StartPage {
  protected readonly i18n = inject(I18nService);
}
