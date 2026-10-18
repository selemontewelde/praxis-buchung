# The practice config is a top-level ESM module, not part of the backend

ADR-0001 established *what* the config holds (branding/contact/legal plus an
initial seed) and that the database is the source of truth at runtime. This ADR
records *where* that config lives and why, decided in milestone 2 when the file
was actually created.

The product is sold as a template a practice customises by editing one file, so
the editing experience for a non-technical owner was the priority. A file buried
in `backend/src/` is hard to find; a prominent top-level folder is not.

**Decision.** Put the config in a top-level **`config/`** folder — `practice.config.ts`,
its types, and its consistency validation — as its own ESM module
(`config/package.json` with `"type": "module"`). Only backend *tooling* imports it:
the seed script (run via `tsx`) and the validation's unit test. Application
`src/` code does **not** import it; when the public website needs branding
(milestone 3), the backend will read the config and serve it over the API rather
than the frontend importing the file.

Two mechanics follow from this placement and are deliberate, not accidental:

- `config/` needs its own `package.json` with `"type": "module"`, otherwise
  TypeScript treats the files as CommonJS (the repo root has no `type`) and rejects
  the ESM `.js` import specifiers.
- The backend's type-check `tsconfig.json` widens `rootDir` to the repo root so it
  can cover the seed and the imported config. The build (`tsconfig.build.json`)
  keeps `rootDir: "./src"` and `include: ["src"]`, so the config is never pulled
  into the compiled app output — which is also why the validation lives in `config/`
  and not in `src/` (a `src/` file importing the config, even as a type, breaks the
  build's `rootDir` constraint).

Alternatives considered: keeping the config under `backend/src/config/` (clean
imports, poor discoverability) and promoting `config/` to a full workspace package
with its own build (clean imports *and* discoverability, but a build step and
project-reference wiring that only one consumer currently needs). The top-level
loose ESM module is the lightest option that gives the discoverability we wanted.

## Consequences

- The config is the obvious first thing a new practice edits, matching the
  template's promise.
- Imports into the config from backend tooling use deep relative paths
  (`../../config/…`, `../../../config/…`); acceptable given only two tooling call
  sites.
- `config/practice-config.types.ts` restates the weekdays as a string-literal union
  mirroring the Prisma `Weekday` enum, because the config module must not depend on
  the generated client; the seed maps between them.
- Revisit if a second consumer needs the config at build time (e.g. the frontend
  importing it directly): promoting `config/` to a built workspace package would
  then pay for itself.
