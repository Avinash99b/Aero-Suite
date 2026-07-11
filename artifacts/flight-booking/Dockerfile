# SkyReserve web frontend — production image.
#
# Build context MUST be the monorepo root:
#
#   docker build -f artifacts/flight-booking/Dockerfile -t skyreserve-web .
#
# The static bundle is reconfigurable at container *runtime* (no rebuild
# needed): the entrypoint regenerates /usr/share/nginx/html/config.js from
# env vars on every container start (see docker/entrypoint.sh).

FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc* ./
COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

# BASE_PATH/PORT are only consulted by vite.config.ts (base path + dev-server
# port); neither affects the built assets' runtime behavior, which is
# controlled entirely by public/config.js at container start.
ENV BASE_PATH=/
ENV PORT=5173
RUN pnpm --filter @workspace/flight-booking run build

FROM nginx:1.27-alpine AS runtime
COPY artifacts/flight-booking/docker/nginx.conf /etc/nginx/conf.d/default.conf.template
COPY artifacts/flight-booking/docker/entrypoint.sh /docker-entrypoint.d/40-skyreserve-config.sh
RUN chmod +x /docker-entrypoint.d/40-skyreserve-config.sh
COPY --from=build /app/artifacts/flight-booking/dist/public /usr/share/nginx/html

# Configurable at runtime (docker run -e / compose):
#   PORT                    nginx listen port (default 8080)
#   API_BASE_URL            absolute URL of the API server, e.g.
#                           https://api.example.com (empty = same-origin "/api")
#   CLERK_PUBLISHABLE_KEY   Clerk publishable key
#   CLERK_PROXY_URL         Clerk Frontend API proxy path (optional)
ENV PORT=8080
ENV API_BASE_URL=""
ENV CLERK_PUBLISHABLE_KEY=""
ENV CLERK_PROXY_URL=""

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
