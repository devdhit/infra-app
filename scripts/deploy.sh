#!/bin/bash

# Deployment script for the ITAMS application

# Exit on any error
set -e

echo "Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application (both Next.js and server-side TypeScript)
echo "Building application..."
npm run build:production

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Error: Build failed"
    exit 1
fi

# Start the application with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "Deployment completed successfully!"