#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "[Startup] Waiting for PostgreSQL to be ready..."
# We rely on Docker Compose healthchecks/depends_on to wait for DB generally,
# but we can add a simple sleep or ping here if needed.
# Since we have depends_on: condition: service_healthy, the DB is already up.

echo "[Startup] Generating Prisma Client..."
npx prisma generate

echo "[Startup] Running database migrations..."
npx prisma migrate deploy

echo "[Startup] Starting NestJS Application..."
exec node dist/main
