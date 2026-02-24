#!/bin/sh
set -e

# Run Prisma migrations on startup
echo "Running database migrations..."
npx prisma db push --skip-generate 2>/dev/null || echo "Migration skipped (database may not be ready yet)"

exec "$@"
