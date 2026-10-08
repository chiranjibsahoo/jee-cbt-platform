#!/bin/bash
export PATH=/System/Volumes/Data/Users/sunaj/developer-tools/bin:$PATH

echo "Resetting database and seeding fresh data..."
cd apps/api
npx prisma db push --accept-data-loss
npx ts-node src/seed.ts

echo "Database reset complete! You can now log in with the demo accounts."
