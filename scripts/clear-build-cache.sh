#!/bin/bash

# Script to clear Next.js build cache and rebuild

echo "Clearing Next.js build cache..."

# Remove Next.js build directory
if [ -d ".next" ]; then
    echo "Removing .next directory..."
    rm -rf .next
    echo ".next directory removed."
else
    echo ".next directory not found."
fi

# Remove node_modules and reinstall (optional, uncomment if needed)
# echo "Removing node_modules directory..."
# rm -rf node_modules
# echo "node_modules directory removed."
# echo "Reinstalling dependencies..."
# npm install --production

# Regenerate Prisma client
echo "Regenerating Prisma client..."
npx prisma generate

echo "Build cache cleared. You can now run 'npm run build' to rebuild the project."