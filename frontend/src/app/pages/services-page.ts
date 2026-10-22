import { Component, inject } from '@angular/core';
import { PublicContentService } from '../core/content.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'app-services-page',
  template: `
    <h1>{{ i18n.t('pages.services.title') }}</h1>
    <ul class="service-list">
      @for (service of content.services(); track service.id) {
        <li class="service-card">
          <div class="service-head">
            <h2>{{ service.name }}</h2>
            <span class="service-duration"
              >{{ service.durationMin }} {{ i18n.t('services.minutesShort') }}</span
            >
          </div>
          <p class="service-desc">
            {{ i18n.pick(service.description) }}
          </p>
        </li>
      }
    </ul>
  `,
  styles: `
    .service-list {
      list-style: none;
      padding: 0;
      margin: 1.5rem 0 0;
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
    }
    .service-card {
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      background: var(--color-surface);
    }
    .service-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .service-head h2 {
      font-size: 1.15rem;
      margin: 0;
    }
    .service-duration {
      color: var(--color-muted);
      white-space: nowrap;
      font-size: 0.9rem;
    }
    .service-desc {
      margin: 0.5rem 0 0;
      color: var(--color-text);
    }
  `,
})
export class ServicesPage {
  protected readonly i18n = inject(I18nService);
  protected readonly content = inject(PublicContentService);

  constructor() {
    void this.content.loadServices();
  }
}
