#!/bin/sh
set -e

echo "Applying database schema..."
node node_modules/prisma/build/index.js db push --schema=prisma/schema.prisma --skip-generate
echo "Starting GudForm..."
exec node server.js
