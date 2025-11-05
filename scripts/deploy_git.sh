#!/bin/bash

# Git-based deployment script for the ITAMS application

# Exit on any error
set -e

# Configuration
APP_DIR="/opt/itams"
APP_NAME="itams"

echo "=== [1] Di chuyển vào thư mục dự án ==="

cd $APP_DIR || { echo "❌ Không tìm thấy thư mục $APP_DIR"; exit 1; }

echo "=== [2] Pull code mới nhất từ branch deploy ==="

git fetch origin deploy
git reset --hard origin/deploy

echo "=== [3] Cài đặt dependencies ==="

npm install --legacy-peer-deps

echo "=== [4] Build lại ứng dụng (Next.js) ==="

# Set environment variables for production build
export NODE_ENV=production

# Build the application (both Next.js and server-side TypeScript)
npm run build:production

echo "=== [5] Cập nhật Prisma migration ==="

npx prisma migrate deploy

echo "=== [6] Clean up development files ==="

# Clean up any source maps or development files
find .next -name "*.map" -type f -delete 2>/dev/null || true
find dist -name "*.map" -type f -delete 2>/dev/null || true
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

echo "=== [7] Reload PM2 để áp dụng code mới ==="

# Reload the application with PM2
ITAMS_PATH=$APP_DIR REDIS_URL=redis://localhost:6379 NODE_ENV=production pm2 reload ecosystem.config.js --only $APP_NAME

echo "=== [8] Save PM2 configuration ==="

pm2 save

echo "=== ✅ Deploy hoàn tất cho $APP_NAME ==="

pm2 status $APP_NAME