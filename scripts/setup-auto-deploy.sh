#!/bin/bash

# Setup script for ITAMS Auto Deployment System

echo "Setting up ITAMS Auto Deployment System..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo)"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Script directory: $SCRIPT_DIR"
echo "Project directory: $PROJECT_DIR"

# Create necessary directories
mkdir -p /opt/itams/scripts
mkdir -p /var/log
mkdir -p /var/run

# Copy scripts to the appropriate locations
echo "Copying auto-deploy.sh from $SCRIPT_DIR/auto-deploy.sh to /opt/itams/scripts/"
cp "$SCRIPT_DIR/auto-deploy.sh" /opt/itams/scripts/
echo "Copying itams-auto-deploy.service from $SCRIPT_DIR/itams-auto-deploy.service to /etc/systemd/system/"
cp "$SCRIPT_DIR/itams-auto-deploy.service" /etc/systemd/system/
echo "Copying itams-auto-deploy.timer from $SCRIPT_DIR/itams-auto-deploy.timer to /etc/systemd/system/"
cp "$SCRIPT_DIR/itams-auto-deploy.timer" /etc/systemd/system/

# Make the auto-deploy script executable
chmod +x /opt/itams/scripts/auto-deploy.sh

# Reload systemd daemon
systemctl daemon-reload

# Enable and start the timer
systemctl enable itams-auto-deploy.timer
systemctl start itams-auto-deploy.timer

echo "ITAMS Auto Deployment System setup completed!"
echo "The system will now check for updates every 5 minutes."
echo "You can check the status with: systemctl status itams-auto-deploy.timer"
echo "View logs with: tail -f /var/log/itams-auto-deploy.log"