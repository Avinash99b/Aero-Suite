#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Exiting."
  exit 1
fi

echo ">>> Applying schema (drizzle-kit push)..."
cd /app/lib/db
pnpm run push-force
cd /app

echo ">>> Applying stored procedures..."
psql "$DATABASE_URL" -f /app/lib/db/sql/procedures.sql

echo ">>> Applying triggers..."
psql "$DATABASE_URL" -f /app/lib/db/sql/triggers.sql

echo ">>> Applying views..."
psql "$DATABASE_URL" -f /app/lib/db/sql/views.sql

if [ "$SEED" = "true" ]; then
  echo ">>> Seeding database..."
  cd /app/artifacts/api-server
  /app/node_modules/.pnpm/node_modules/.bin/tsx src/scripts/seed.ts
  cd /app
fi

echo ">>> Starting API server on port $API_PORT..."
PORT=$API_PORT pnpm --filter @workspace/api-server run dev &

echo ">>> Starting Vite frontend on port $PORT..."
PORT=$PORT BASE_PATH=$BASE_PATH API_PORT=$API_PORT \
  pnpm --filter @workspace/flight-booking run dev &

wait
