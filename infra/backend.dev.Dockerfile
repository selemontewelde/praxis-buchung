# Development image for the NestJS backend (hot-reload via `nest start --watch`).
# The lean, multi-stage *production* image arrives in milestone 8.
FROM node:22-slim

WORKDIR /app

# Install workspace dependencies first for better layer caching: copying only the
# manifests means a source change does not invalidate the `npm ci` layer.
# .npmrc carries legacy-peer-deps, which the workspace install needs here too.
COPY package.json package-lock.json .npmrc ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci

# Application source. At runtime a bind mount overlays ./backend for live reload;
# this copy keeps the image runnable on its own (e.g. in CI).
COPY . .

EXPOSE 3000
CMD ["npm", "run", "start:dev", "--workspace", "backend"]
