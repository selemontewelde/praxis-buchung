import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PracticeService } from '../core/practice.service';
import { PublicContentService } from '../core/content.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'app-start-page',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <h1>{{ practice.branding()?.name ?? i18n.t('pages.home.title') }}</h1>
      @if (practice.branding()?.tagline; as tagline) {
        <p class="tagline">{{ tagline }}</p>
      }
      <p class="intro">{{ i18n.t('home.intro') }}</p>
      <a class="cta" routerLink="/leistungen">{{
        i18n.t('home.viewServices')
      }}</a>
    </section>

    @if (content.services().length > 0) {
      <section class="teaser">
        <h2>{{ i18n.t('home.ourServices') }}</h2>
        <ul>
          @for (service of content.services(); track service.id) {
            <li>{{ service.name }}</li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    .hero {
      padding: 1rem 0 2rem;
    }
    .tagline {
      font-size: 1.25rem;
      color: var(--color-muted);
      margin: 0 0 1rem;
    }
    .intro {
      max-width: 42rem;
    }
    .cta {
      display: inline-block;
      margin-top: 1rem;
      background: var(--color-primary);
      color: #fff;
      text-decoration: none;
      padding: 0.6rem 1.2rem;
      border-radius: 999px;
      font-weight: 600;
    }
    .teaser ul {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      list-style: none;
      padding: 0;
    }
    .teaser li {
      border: 1px solid var(--color-border);
      border-radius: 999px;
      padding: 0.3rem 0.9rem;
      background: var(--color-surface);
    }
  `,
})
export class StartPage {
  protected readonly i18n = inject(I18nService);
  protected readonly practice = inject(PracticeService);
  protected readonly content = inject(PublicContentService);

  constructor() {
    void this.content.loadServices();
  }
}
