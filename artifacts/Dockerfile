# SkyReserve — combined dev container
#
# Runs the Express API server and the Vite dev frontend in a single container.
# All /api/... requests from the browser are proxied internally by Vite to the
# API server — no external routing needed.
#
# Build (from the monorepo root):
#   docker build -f artifacts/Dockerfile -t skyreserve .
#
# Run:
#   docker run -p 3000:3000 \
#     -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
#     -e SESSION_SECRET="change-me-in-production" \
#     skyreserve
#
# On first run, add -e SEED=true to populate the database with demo data.
#
# The app is then available at http://localhost:3000
# API calls to /api/... are forwarded internally to port 3001.

# node:24-slim (Debian/glibc) — NOT alpine.
# The pnpm-workspace.yaml excludes @rollup/rollup-linux-x64-musl ('-'),
# so Alpine (musl libc) would fail to find the rollup native binary.
# Debian uses glibc, which matches the lockfile's expected platform.
FROM node:24-slim

# postgresql-client provides psql, used in the entrypoint to apply
# procedures.sql / triggers.sql / views.sql against DATABASE_URL.
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Enable corepack so pnpm is available
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

# ── Manifests first — changes here bust the install cache ─────────────────
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY tsconfig.base.json tsconfig.json ./
COPY lib/package.json* ./lib/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/flight-booking/package.json ./artifacts/flight-booking/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# ── Source (after install so the layer above stays cached on dep changes) ──
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server
COPY artifacts/flight-booking ./artifacts/flight-booking
COPY artifacts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# ── Ports ──────────────────────────────────────────────────────────────────
# API_PORT  internal Express server (never exposed outside the container)
# PORT      Vite dev server, exposed to the host
ENV API_PORT=3001
ENV PORT=3000
ENV BASE_PATH=/
ENV NODE_ENV=development

# ── Runtime env vars (pass with -e) ───────────────────────────────────────
# DATABASE_URL   postgresql connection string          (required)
# SESSION_SECRET random secret for JWT signing         (required)
# SEED=true      seed demo data on first start         (optional)

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
