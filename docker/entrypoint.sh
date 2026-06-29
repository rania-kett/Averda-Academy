#!/bin/sh
set -e

cd /app/server

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Applying database migrations…"
  npx prisma migrate deploy
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "[entrypoint] Seeding database (demo data)…"
  npx prisma db seed
fi

cd /app
exec "$@"
