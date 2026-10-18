import { Component, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';

// Placeholder — real team list (from the public API) arrives in issue #9.
@Component({
  selector: 'app-team-page',
  template: `<h1>{{ i18n.t('pages.team.title') }}</h1>`,
})
export class TeamPage {
  protected readonly i18n = inject(I18nService);
}
