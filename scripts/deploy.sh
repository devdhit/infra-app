#!/bin/bash

# Deployment script for the ITAMS application

# Exit on any error
set -e

# Configuration
LOCAL_REPO_DIR="${ITAMS_PATH:-/opt/itams}"

echo "Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Create logs directory
mkdir -p $LOCAL_REPO_DIR/logs

# Check if Redis is running
if ! systemctl is-active --quiet redis-server; then
    echo "Starting Redis server..."
    systemctl start redis-server
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Set environment variables for production build
export NODE_ENV=production

# Build the application (both Next.js and server-side TypeScript)
echo "Building application..."
npm run build:production

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Error: Build failed"
    exit 1
fi

# Clean up any source maps or development files
echo "Cleaning up development files..."
find .next -name "*.map" -type f -delete 2>/dev/null || true
find dist -name "*.map" -type f -delete 2>/dev/null || true

# Start the application with PM2
echo "Starting application with PM2..."
ITAMS_PATH=$LOCAL_REPO_DIR REDIS_URL=redis://localhost:6379 NODE_ENV=production pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "Deployment completed successfully!"