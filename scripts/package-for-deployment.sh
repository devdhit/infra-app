#!/bin/bash

# Package script for ITAMS deployment
# This script creates a deployment package for the ITAMS application

# Exit on any error
set -e

echo "Creating deployment package for ITAMS..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Create deployment directory
DEPLOY_DIR="itams-deployment"
echo "Creating deployment directory: $DEPLOY_DIR"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy source files
echo "Copying source files..."
cp -r src $DEPLOY_DIR/
cp -r prisma $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp -r scripts $DEPLOY_DIR/

# Copy configuration files
echo "Copying configuration files..."
cp package.json $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp tsconfig.build.json $DEPLOY_DIR/
cp ecosystem.config.js $DEPLOY_DIR/
cp server.js $DEPLOY_DIR/
cp next.config.mjs $DEPLOY_DIR/
cp .env.production $DEPLOY_DIR/ 2>/dev/null || echo "No .env.production file found"
cp .env $DEPLOY_DIR/ 2>/dev/null || echo "No .env file found"
cp .gitignore $DEPLOY_DIR/
cp README.md $DEPLOY_DIR/
cp LICENSE $DEPLOY_DIR/ 2>/dev/null || echo "No LICENSE file found"

# Create dist directory structure
echo "Creating dist directory structure..."
mkdir -p $DEPLOY_DIR/dist

# Create a tarball for deployment
echo "Creating deployment package..."
tar -czf itams-deployment.tar.gz $DEPLOY_DIR

echo "Deployment package created: itams-deployment.tar.gz"
echo "To deploy:"
echo "1. Copy itams-deployment.tar.gz to your Linux server"
echo "2. Extract it to /opt/itams:"
echo "   sudo mkdir -p /opt/itams"
echo "   sudo tar -xzf itams-deployment.tar.gz -C /opt/itams --strip-components=1"
echo "3. Run the deployment script:"
echo "   cd /opt/itams && sudo scripts/deploy.sh"