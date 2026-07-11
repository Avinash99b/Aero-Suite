#!/bin/sh
# Runs as part of the official nginx image's /docker-entrypoint.d/ hook chain
# (executes before nginx starts). Regenerates the runtime config consumed by
# the already-built static bundle, and renders the nginx listen port from
# PORT so the same image works on any platform-assigned port.
set -eu

: "${PORT:=8080}"
export PORT

envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

cat > /usr/share/nginx/html/config.js <<EOF
window.__ENV__ = {
  API_BASE_URL: "${API_BASE_URL:-}",
  CLERK_PUBLISHABLE_KEY: "${CLERK_PUBLISHABLE_KEY:-}",
  CLERK_PROXY_URL: "${CLERK_PROXY_URL:-}"
};
EOF
