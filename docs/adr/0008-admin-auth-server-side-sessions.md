# Admin auth uses server-side sessions in an HTTP-only cookie, not JWT

Milestone 7 put the whole back office (therapists, hours, blocks, services,
appointments with patient contact data) behind a login (issue #18). Two choices
had to be made and are hard to reverse once the admin area is built on them: how
passwords are stored, and how a logged-in request is recognised.

**Decision 1 — passwords: argon2id.** Admin passwords are stored as an
**argon2id** hash (`@node-rs/argon2`, prebuilt native binaries, no build
toolchain needed). argon2id is a memory-hard KDF and the current OWASP default;
it beats bcrypt for new systems. Passwords are never stored or logged in clear.

**Decision 2 — sessions, not JWT.** A login creates a **server-side session
row** in Postgres and returns a random 256-bit token (`randomBytes(32)`) in an
**HTTP-only, SameSite=Lax** cookie (`Secure` in production). The token is **not**
a JWT and carries no claims; it is an opaque lookup key.

- **Only the SHA-256 of the token is stored** in the DB; the raw token lives
  only in the cookie. A database read — a leak, a backup, a `pg_dump` (we take a
  daily one) — therefore cannot be replayed as a live session.
- The cookie is **HTTP-only**, so client JavaScript can't read it (XSS can't
  exfiltrate the session); **SameSite=Lax** blocks it from cross-site POSTs,
  which covers the main CSRF vector for a cookie-authenticated API.
- A `SessionAuthGuard` validates the cookie on each admin request: look up the
  hashed token, reject if missing or expired (expired rows are deleted on sight).
- **Logout deletes the row**, so sessions are genuinely revocable server-side.

**Why not JWT.** A stateless JWT can't be revoked before it expires without
adding the very server-side denylist a session table already is, and it pushes
secret-rotation and clock-skew handling onto us for no gain here: this is one
practice with a tiny admin audience, where a DB round-trip per request is free
and instant revocation (logout, "log out everywhere") is the property we
actually want. Storing claims in a token the browser holds also tempts putting
state there that then can't be changed server-side.

## Consequences

- Every admin request does one indexed DB lookup on the session token. For this
  scale that cost is negligible and buys revocability.
- Sessions survive an app restart (they are rows, not in-memory) but a database
  reset logs everyone out — acceptable, and in fact the safe default.
- Security depends on the cookie flags being correct per environment: `Secure`
  must be on in production (HTTPS, set at the deployment milestone) or the token
  can travel in clear. SameSite=Lax is a good default but is not, by itself, a
  full CSRF defence for any future same-site state-changing form posted from the
  browser — revisit explicit CSRF tokens in the security-pass milestone (#9) if
  the admin UI moves away from a custom `fetch`/XHR JSON client.
- Expired sessions are pruned lazily (on access); there is no sweeper job. For a
  small session table that is fine; a scheduled cleanup can be added later.
- The login check does a real argon2 verify only when the user exists, so a
  missing user returns slightly faster — a minor timing signal, accepted for a
  single-practice admin (noted in the code).
