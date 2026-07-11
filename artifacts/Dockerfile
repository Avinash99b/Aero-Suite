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
# The app is then available at http://localhost:3000
# API calls to /api/... are forwarded internally to port 3001.

# node:24-slim (Debian/glibc) — NOT alpine.
# The pnpm-workspace.yaml excludes @rollup/rollup-linux-x64-musl ('-'),
# so Alpine (musl libc) would fail to find the rollup native binary.
# Debian uses glibc, which matches the lockfile's expected platform.
FROM node:24-slim

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

# ── Ports ──────────────────────────────────────────────────────────────────
# API_PORT  internal Express server (never exposed outside the container)
# PORT      Vite dev server, exposed to the host
ENV API_PORT=3001
ENV PORT=3000
ENV BASE_PATH=/
ENV NODE_ENV=development

# ── Required at runtime (pass with -e) ────────────────────────────────────
# DATABASE_URL   postgresql connection string
# SESSION_SECRET random secret for JWT signing (min 32 chars recommended)

EXPOSE 3000

# Start both services concurrently.
# Vite proxies /api/* → Express on API_PORT (set in vite.config.ts).
CMD ["sh", "-c", "PORT=$API_PORT pnpm --filter @workspace/api-server run dev & PORT=$PORT BASE_PATH=$BASE_PATH API_PORT=$API_PORT pnpm --filter @workspace/flight-booking run dev & wait"]
