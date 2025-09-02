#!/bin/bash

# Setup script for ITAMS Auto Deployment System

echo "Setting up ITAMS Auto Deployment System..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo)"
    exit 1
fi

# Create necessary directories
mkdir -p /opt/itams/scripts
mkdir -p /var/log
mkdir -p /var/run

# Copy scripts to the appropriate locations
cp ./auto-deploy.sh /opt/itams/scripts/
cp ./itams-auto-deploy.service /etc/systemd/system/
cp ./itams-auto-deploy.timer /etc/systemd/system/

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