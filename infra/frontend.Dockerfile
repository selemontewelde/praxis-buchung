# Production image for the Angular frontend: multi-stage. The compiled static
# files are served by an unprivileged (non-root) nginx on port 8080. The /api
# routing to the backend is handled by the edge Caddy reverse proxy (issue #25),
# not here — this image only serves the SPA with a client-routing fallback.

FROM node:26-slim AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build --workspace frontend

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
# SPA fallback: unknown paths serve index.html so Angular's router handles them.
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist/frontend/browser /usr/share/nginx/html
EXPOSE 8080
