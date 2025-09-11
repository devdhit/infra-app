#!/bin/bash

# Setup script for ITAMS on Ubuntu

# Exit on any error
set -e

echo "Setting up ITAMS on Ubuntu..."

# Update package list
apt update

# Install required packages
echo "Installing required packages..."
apt install -y curl wget git build-essential

# Install Node.js using NodeSource repository
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install Redis
echo "Installing Redis..."
apt install -y redis-server

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Install PostgreSQL client
echo "Installing PostgreSQL client..."
apt install -y postgresql-client

# Create application directory
echo "Creating application directory..."
mkdir -p /opt/itams
chown www-data:www-data /opt/itams

# Create logs directory
mkdir -p /opt/itams/logs
chown www-data:www-data /opt/itams/logs

# Setup PM2 to start on boot
echo "Setting up PM2 startup..."
sudo -u www-data pm2 startup systemd -u www-data --hp /home/www-data

# Create systemd service file
echo "Creating systemd service file..."
cat > /etc/systemd/system/itams.service << 'EOF'
[Unit]
Description=IT Asset Management System
After=network.target

[Service]
Type=forking
User=www-data
WorkingDirectory=/opt/itams
ExecStart=/usr/local/bin/pm2 start /opt/itams/ecosystem.config.js
ExecReload=/usr/local/bin/pm2 reload itams
ExecStop=/usr/local/bin/pm2 stop itams
Restart=always
RestartSec=10
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
Environment=ITAMS_PATH=/opt/itams
Environment=REDIS_URL=redis://localhost:6379

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start Redis
systemctl enable redis-server
systemctl start redis-server

echo "Setup completed successfully!"
echo "Next steps:"
echo "1. Clone your repository to /opt/itams"
echo "2. Run the deployment script: /opt/itams/scripts/deploy.sh"
echo "3. Enable the service: systemctl enable itams"
echo "4. Start the service: systemctl start itams"