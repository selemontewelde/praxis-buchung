# npm workspaces as the monorepo tool, with legacy-peer-deps enabled

The repository is a monorepo with a `frontend/` (Angular) and a `backend/` (NestJS)
package, each scaffolded by its own CLI. We needed a package manager / workspace tool
and a reproducible install for both CI and local development.

**Decision.** Use **npm workspaces** (no extra tooling such as pnpm, Yarn or Turborepo):
one hoisted `node_modules`, one `package-lock.json`, and root scripts that fan
`lint`/`typecheck`/`test`/`build` out to both packages. Enable **`legacy-peer-deps=true`**
in a committed `.npmrc`.

The two packages ship different major versions of the Vite/Vitest toolchain (Angular's
`@angular/build` vs NestJS' test setup). npm 10's peer-dependency resolver crashes on
that cross-workspace graph with `Cannot read properties of null (reading 'edgesOut')`,
which aborts `npm install` / `npm ci`. `legacy-peer-deps` skips the peer-resolution step
that triggers the bug, so the install completes.

## Consequences

- A single `npm ci` at the repo root installs both workspaces; CI caches one `~/.npm`
  keyed by the single lockfile.
- `.npmrc` is committed so local installs and `npm ci` in CI behave identically — without
  it, CI hits the same crash.
- `legacy-peer-deps` disables peer-dependency validation **repo-wide**, so genuine peer
  conflicts introduced later will not fail the install. Mitigated by pinning framework
  versions deliberately (e.g. TypeScript 6.0.x, which Angular 22 requires) and by the
  "revisit" note in `.npmrc`: once npm ships the arborist fix, re-evaluate removing it.
- Switching to pnpm/Yarn/Turborepo later is possible but would change the lockfile,
  install semantics and CI caching; deferred unless a concrete need appears.
