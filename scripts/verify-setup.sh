#!/bin/bash

# Verification script for ITAMS Auto Deployment System

echo "Verifying ITAMS Auto Deployment System files..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo) for complete verification"
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Script directory: $SCRIPT_DIR"

# List files in the scripts directory
echo "Files in scripts directory:"
ls -la $SCRIPT_DIR

# Check if required files exist
REQUIRED_FILES=("auto-deploy.sh" "itams-auto-deploy.service" "itams-auto-deploy.timer" "setup-auto-deploy.sh")

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        echo "✓ $file found"
    else
        echo "✗ $file NOT FOUND"
    fi
done

# Check if files are executable
if [ -f "$SCRIPT_DIR/auto-deploy.sh" ]; then
    if [ -x "$SCRIPT_DIR/auto-deploy.sh" ]; then
        echo "✓ auto-deploy.sh is executable"
    else
        echo "✗ auto-deploy.sh is NOT executable"
    fi
fi

echo "Verification complete."