#!/bin/bash
set -e

echo "🚀 Running Railway deployment migrations..."

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma db push --skip-generate

# Seed agents if not exists
echo "🌱 Checking if agents need to be seeded..."
npm run seed || true

# Add product agent if not exists
npm run add-product-agent || true

echo "✅ Deployment setup complete!"
