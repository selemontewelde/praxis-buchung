# Runtime i18n with a signal-based service, both languages over the API

The public website is bilingual (German default, English second) with a language
switch that must change the UI instantly, without a reload. Decided in milestone 3
when the site shell was built.

**Decision.** Do the translation at runtime with a small **signal-based
`I18nService`**, not with a library and not with Angular's built-in i18n:

- A `language` signal holds the current language; `t(key)` and `pick(de, en)` read
  it, so any template binding that calls them is tracked and re-renders on a
  switch — no pipe, no reload. The choice is persisted in `localStorage` and
  reflected on `<html lang>`. German is both the default and the fallback.
- UI strings live in typed DE/EN dictionaries; `TranslationKey` is derived from
  the German map, so TypeScript forces every language to cover the same keys.

For **operational content that carries text in both languages** (service
descriptions, team roles), the read API returns **both variants**
(`descriptionDe`/`descriptionEn`, …) and the frontend picks one with
`i18n.pick()`. Switching language therefore needs no refetch.

Alternatives rejected:

- **Angular's built-in i18n** is compile-time: it produces one bundle per locale
  and cannot toggle language at runtime, which the requirement needs.
- **A runtime i18n library** (Transloco, ngx-translate) would do the job, but
  Angular 22 was very new at the time and these libraries commonly lag a major
  version; a ~20-line signal service avoids that risk and the dependency, and a
  two-language mostly-static site does not need their lazy-loading / ICU features.
- **`Accept-Language` content negotiation** for the API was rejected so the client
  can switch instantly from already-loaded data, and so one response can be cached
  regardless of UI language.

## Consequences

- The language switch is immediate and offline-capable; no network round-trip.
- Adding a language means adding one dictionary (TypeScript then flags any missing
  key) — but every bilingual DB field is a `…De`/`…En` column pair, so a *third*
  language would need a schema change, not just a dictionary. Acceptable: the
  product targets DE/EN only.
- If the content model ever outgrows two languages or needs rich ICU formatting,
  revisit and move to a dedicated i18n library then.
- The API sends both language variants of each field, slightly larger payloads in
  exchange for instant switching and simpler caching.
