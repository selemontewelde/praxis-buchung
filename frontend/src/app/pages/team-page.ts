import { Component, inject } from '@angular/core';
import { PublicContentService } from '../core/content.service';
import { I18nService } from '../i18n/i18n.service';

@Component({
  selector: 'app-team-page',
  template: `
    <h1>{{ i18n.t('pages.team.title') }}</h1>
    @if (content.team().length === 0) {
      <p>{{ i18n.t('team.empty') }}</p>
    } @else {
      <ul class="team-list">
        @for (member of content.team(); track member.firstName + member.lastName) {
          <li class="team-card">
            @if (member.photoUrl) {
              <img
                class="team-photo"
                [src]="member.photoUrl"
                [alt]="member.firstName + ' ' + member.lastName"
                width="96"
                height="96"
              />
            }
            <h2 class="team-name">
              {{ member.firstName }} {{ member.lastName }}
              @if (member.title) {
                <span class="team-title">{{ member.title }}</span>
              }
            </h2>
            <p class="team-role">{{ i18n.pick(member.roleDe, member.roleEn) }}</p>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .team-list {
      list-style: none;
      padding: 0;
      margin: 1.5rem 0 0;
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
    }
    .team-card {
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 1.25rem;
      background: var(--color-surface);
      text-align: center;
    }
    .team-photo {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    }
    .team-name {
      font-size: 1.1rem;
      margin: 0.75rem 0 0.25rem;
    }
    .team-title {
      color: var(--color-muted);
      font-weight: 400;
      font-size: 0.85rem;
    }
    .team-role {
      margin: 0;
      color: var(--color-muted);
    }
  `,
})
export class TeamPage {
  protected readonly i18n = inject(I18nService);
  protected readonly content = inject(PublicContentService);

  constructor() {
    void this.content.loadTeam();
  }
}
