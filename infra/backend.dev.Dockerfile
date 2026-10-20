# Development image for the NestJS backend (hot-reload via `nest start --watch`).
# The lean, multi-stage *production* image arrives in milestone 8.
FROM node:22-slim

WORKDIR /app

# Copy the whole monorepo, then install. Unlike the production image, this dev
# image favours correctness over fine layer caching: `npm ci` runs the workspace
# postinstall hooks — the @praxis-buchung/config package compiles itself and the
# backend runs `prisma generate` — which need the source present at install time.
# .dockerignore keeps node_modules, dist, .angular and the generated client out,
# so those are produced fresh inside the image. .npmrc carries legacy-peer-deps.
COPY . .
RUN npm ci

EXPOSE 3000
# At runtime a bind mount overlays ./backend for live reload; anonymous volumes
# shield the install output (see docker-compose.yml).
CMD ["npm", "run", "start:dev", "--workspace", "backend"]
