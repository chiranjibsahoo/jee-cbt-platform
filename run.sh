#!/bin/bash
export PATH=/System/Volumes/Data/Users/sunaj/developer-tools/bin:$PATH

echo "Initializing database..."
cd apps/api
npx prisma db push
npx ts-node src/seed.ts

echo "Starting servers..."
cd ../..
npm run dev
