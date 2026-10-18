# Development image for the Angular frontend (dev server with live reload).
# The lean, multi-stage *production* image (static build behind Caddy) arrives in
# milestone 8.
FROM node:22-slim

WORKDIR /app

# Copy the whole monorepo, then install. The single workspace install runs every
# workspace's postinstall hook (the config package build, the backend's
# `prisma generate`), which need the source present — so, like the backend dev
# image, this favours correctness over layer caching. .dockerignore keeps
# node_modules and build output out; .npmrc carries legacy-peer-deps.
COPY . .
RUN npm ci

EXPOSE 4200
# --host 0.0.0.0 makes the dev server reachable from the host; --poll makes file
# watching reliable across the Docker bind mount. The /api proxy target is read
# from API_PROXY_TARGET (set in docker-compose.yml).
CMD ["npm", "run", "start", "--workspace", "frontend", "--", "--host", "0.0.0.0", "--poll", "1000"]
