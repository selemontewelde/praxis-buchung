# Production image for the NestJS backend: multi-stage, runs as non-root.
#
# Stage 1 (builder) installs the whole monorepo so the workspace postinstall
# hooks run (the @praxis-buchung/config build + `prisma generate`), then compiles
# just the backend. Stage 2 (runtime) keeps only production dependencies and the
# built output, and runs as the unprivileged `node` user the base image provides.

FROM node:22-slim AS builder
WORKDIR /app
# .dockerignore keeps host node_modules / dist / the generated client out, so
# they are produced fresh inside the image.
COPY . .
RUN npm ci
RUN npm run build --workspace backend

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Install production dependencies only. --ignore-scripts skips `prisma generate`
# and the config build (both already produced in the builder and copied below).
# All three workspace manifests are copied so the workspace graph resolves and
# the @praxis-buchung/config symlink is created under node_modules. (npm ci can't
# cleanly scope to one workspace, so this also pulls the frontend's Angular
# runtime deps in — ~39 MB the backend never uses; an isolated backend-only
# install is a possible future size optimisation.)
COPY package.json package-lock.json .npmrc ./
COPY config/package.json ./config/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --omit=dev --ignore-scripts
# Built workspace output from the builder (config/dist is what @praxis-buchung/
# config resolves to; backend/dist contains the compiled app + Prisma client).
COPY --from=builder /app/config/dist ./config/dist
COPY --from=builder /app/backend/dist ./backend/dist
# Schema + migrations travel with the image so a later milestone (#25) can run
# `prisma migrate deploy` before the app starts.
COPY --from=builder /app/backend/prisma ./backend/prisma
USER node
EXPOSE 3000
WORKDIR /app/backend
CMD ["node", "dist/main.js"]
