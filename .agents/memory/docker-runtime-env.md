---
name: Runtime env vars for Dockerized Vite frontend + esbuild-bundled Express backend
description: How this project's api-server (esbuild single-file bundle) and flight-booking frontend (Vite static build) get their configuration from plain environment variables in standalone Docker deployments, without rebuilding images per environment.
---

Backend (`artifacts/api-server`): `build.mjs` already bundles the whole
server (deps included) into one `dist/index.mjs` with esbuild, so the Docker
runtime stage needs only `node` + that file — no `node_modules`. All config
(`DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `PORT`,
`CORS_ORIGIN`, `LOG_LEVEL`) is read from `process.env` at process start, so a
single built image works across environments; only `docker run -e` /
compose env differs.

Frontend (`artifacts/flight-booking`): Vite bakes `VITE_*` vars into the
static bundle at *build* time, which would force a rebuild per deployment
target. Instead this app reads `window.__ENV__` (set by
`public/config.js`, loaded via a `<script src="/config.js">` tag before the
bundle) with `import.meta.env.VITE_*` only as a dev/Replit fallback. The
Docker image's nginx entrypoint (`docker/entrypoint.sh`, hooked in via
`/docker-entrypoint.d/`) regenerates `config.js` from container env vars
(`API_BASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_PROXY_URL`) on every
container start — so the same built image is reconfigurable without
rebuilding.

**Why:** Standalone Docker deployment (frontend/backend on separate
origins/ports, no Replit path-routing proxy) needs runtime-configurable API
base URLs and keys; Vite's built-in env handling can't do that post-build.

**How to apply:** When asked to Dockerize a Vite-based frontend that needs
per-environment config without rebuilding, reach for the
`window.__ENV__` + generated `config.js` + entrypoint-script pattern rather
than baking `VITE_*` vars into the image at build time.
