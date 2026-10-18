# Development image for the Angular frontend (dev server with live reload).
# The lean, multi-stage *production* image (static build behind Caddy) arrives in
# milestone 8.
FROM node:22-slim

WORKDIR /app

# Install workspace dependencies first for better layer caching (see the backend
# Dockerfile for the rationale). .npmrc carries the legacy-peer-deps workaround.
COPY package.json package-lock.json .npmrc ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci

COPY . .

EXPOSE 4200
# --host 0.0.0.0 makes the dev server reachable from the host; --poll makes file
# watching reliable across the Docker bind mount.
CMD ["npm", "run", "start", "--workspace", "frontend", "--", "--host", "0.0.0.0", "--poll", "1000"]
