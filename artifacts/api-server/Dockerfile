# SkyReserve API server — production image.
#
# Build context MUST be the monorepo root (not this directory), since this
# package depends on sibling workspace packages (@workspace/db,
# @workspace/api-zod, ...):
#
#   docker build -f artifacts/api-server/Dockerfile -t skyreserve-api .
#
# The final image is a single self-contained esbuild bundle (dist/index.mjs)
# with no node_modules — all workspace + npm dependencies are inlined at
# build time, so the runtime stage only needs the Node.js runtime.

FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app

# Copy the whole workspace manifest set first (better layer caching), then
# the full source. pnpm's frozen-lockfile install validates against every
# workspace member listed in pnpm-workspace.yaml, so partial copies of the
# monorepo are not supported here.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc* ./
COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/artifacts/api-server/dist ./dist

# Required at runtime (pass via `docker run -e` / compose / your platform's
# secret store — never bake secrets into the image):
#   DATABASE_URL          Postgres connection string
#   CLERK_SECRET_KEY      Clerk backend secret key
#   CLERK_PUBLISHABLE_KEY Clerk publishable key (used for the Clerk API proxy)
# Optional:
#   PORT           HTTP port to listen on (default 8080)
#   NODE_ENV       set to "production" by default in this image
#   LOG_LEVEL      pino log level (default "info")
#   CORS_ORIGIN    comma-separated allowlist of frontend origin(s); unset/"*"
#                  reflects the request origin (fine for same-origin setups)
#   SESSION_SECRET reserved for future cookie-session support

EXPOSE 8080

CMD ["node", "--enable-source-maps", "dist/index.mjs"]
