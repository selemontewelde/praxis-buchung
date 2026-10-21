# Multi-arch images (amd64 + arm64) built with QEMU emulation

ADR-0009 publishes one image per service to GHCR, but only for `linux/amd64`. That
rules out the increasingly common (and cheaper) arm64 VPS, and an arm64 host would
fail to pull a usable image. This records making the images multi-arch, and the
build strategy chosen to do it.

## Decisions

**1. Publish a manifest list spanning `linux/amd64` and `linux/arm64`.** The
`build-push` step gains `platforms: linux/amd64,linux/arm64`, so each image tag
(`latest`, `sha-<commit>`) is an OCI **manifest list**: one tag, one `docker pull`,
the right architecture served to whatever host pulls it. No Dockerfile change was
needed — the base images (`node:22-slim`, `nginxinc/nginx-unprivileged:*-alpine`)
are already multi-arch, and Prisma 7 runs through the `pg` driver adapter with no
Rust query engine (ADR-0003), so there is no amd64-only binary baked in.

**2. Build the arm64 variant by QEMU emulation on the amd64 runner, not on native
arm64 runners.** A single `docker/setup-qemu-action` step registers binfmt
handlers and buildx builds both platforms from one amd64 host. The alternative —
a matrix of native runners (`ubuntu-24.04-arm` for arm64) that each build one
platform, then a manifest-merge job — is faster but materially more workflow code
(per-platform digests, a `docker buildx imagetools create` merge step). For a
single-practice template the simplicity wins.

## Consequences

- The `publish` job is noticeably slower: the arm64 build runs under emulation
  (roughly 2–4× the native build time, per image, across all three images). This
  is tolerable because `publish` runs **only on merge to `main`**, never on a pull
  request, so day-to-day PR feedback is unaffected.
- The slowness is the explicit boundary to revisit: if `publish` time becomes
  painful, the fix is decision 2's native-runner matrix, not dropping arm64.
- The GHA layer cache is scoped per image (not per platform), so both
  architectures of one image share a cache scope; a cold arm64 cache is part of
  why the first multi-arch publish is slowest.
- `docker manifest inspect` (used by the Rollback workflow's existence check) and
  `docker pull` both work unchanged against a manifest list, so nothing downstream
  needed to change.
