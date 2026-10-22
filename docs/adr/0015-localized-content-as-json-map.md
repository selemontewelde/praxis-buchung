# Localized DB content as a per-locale JSON map

ADR-0005 made the UI multilingual (de/en/fr/it/es) but stored DB-backed content
(service descriptions, therapist roles, qualification names) as a fixed `…De`/`…En`
column pair, so a fr/it/es visitor saw the English text. This records remodelling
that content to support all UI languages, and the shape chosen.

## Decisions

**1. Store each translatable field as one JSON (`jsonb`) column holding a
`LocalizedText` map `{ de, en, fr?, it?, es? }`, not as per-locale columns or a
translations table.** `de` and `en` are required; `fr`/`it`/`es` are optional. For
a fixed, small set of locales a map column is the least machinery: no extra table,
no joins on the read path, and the whole translation set travels with its row. A
normalised `Translation(entityType, entityId, field, locale, text)` table would be
more flexible for an open-ended locale set, but that flexibility is not needed for a
single-practice template with the five UI languages, and it would complicate every
read, write and admin editor. The pair-of-columns approach is what we are leaving
precisely because it does not scale past two languages.

**2. Resolve the active language with a fallback chain `active → de → en → first
set`, in the frontend's `pick()`.** The API returns the whole map; the client
picks by the current UI language, so switching language needs no refetch. `de` is
the primary (Swiss-German-market) language and the first fallback; `en` is the
guaranteed second. Requiring both `de` and `en` on every field (validated in the
config and the admin DTOs) means the chain always resolves to real text.

**3. Migrate the existing columns in one forward migration (expand → migrate →
contract).** Each pair is replaced by a `jsonb` column, existing `de`/`en` values
copied in with `jsonb_build_object`, then the old columns dropped — all in one
step. The content volume is tiny and the migration is atomic, so the staged
expand/contract-across-releases dance that large tables need would be overkill here.

## Consequences

- `pick()` changes from `pick(de, en)` to `pick(text: LocalizedText | null)`; the
  public API DTOs and admin views carry the map instead of two fields.
- The admin editors gain a field per locale (de/en required, fr/it/es optional).
- Reads cast the `jsonb` value through a small `asLocalizedText` guard rather than
  trusting an unchecked cast, so a null or legacy value degrades to a fallback
  instead of crashing a page.
- Adding a sixth content language later is a config/seed change plus one optional
  key — no schema migration — but it is not automatically required anywhere, so
  coverage stays the editor's choice.
- The map is stored as opaque `jsonb`: the database does not enforce the
  `LocalizedText` shape. The write paths (seed + validated DTOs) and the read-time
  guard are what keep it well-formed.
- The migration carries over whatever `de`/`en` a row had; a legacy row missing
  one of them yields a partial map that the read guard treats as absent (falls
  back to null). The demo data is reseeded from the config, so this only matters
  for a hand-edited row that was already incomplete.
