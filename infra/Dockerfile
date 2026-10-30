# syntax=docker/dockerfile:1
# Hardened image for the gateway + built UI. Build from the repo root:
#   docker compose -f infra/compose.yaml up --build
# Pin by digest in real life (node:22-alpine@sha256:...) so the base can't change under you.

# ---- build: dev deps, typecheck-free compile, client bundle
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- runtime: production deps only, no compilers, no shell tools we don't need
FROM node:22-alpine AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/build ./build
COPY --from=build /app/dist ./dist

# Not root. A fixed numeric UID that exists in no other image on the host.
USER 10001:10001
EXPOSE 8787
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://127.0.0.1:8787/api/health || exit 1
# Logs go to stdout/stderr, never to a file: the root filesystem is read-only (see compose.yaml).
CMD ["node", "build/src/server/index.js"]
