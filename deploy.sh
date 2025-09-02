#!/bin/bash

# ITAMS Production Deployment Script
# This script automates the deployment process using PM2 and Nginx

echo "Starting ITAMS production deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root (sudo)"
  exit
fi

# Update system packages
echo "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js if not present
if ! command -v node &> /dev/null
then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null
then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null
then
    echo "Installing Nginx..."
    apt install -y nginx
fi

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null
then
    echo "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database user and database
    sudo -u postgres psql -c "CREATE USER itams_user WITH PASSWORD 'Abcd_2025';"
    sudo -u postgres psql -c "CREATE DATABASE itams_db OWNER itams_user;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE itams_db TO itams_user;"
fi

# Navigate to application directory (assuming script is in the app directory)
cd "$(dirname "$0")"

# Install dependencies
echo "Installing application dependencies..."
npm install --production

# Create production build
echo "Creating production build..."
npm run build

# Set up PM2
echo "Setting up PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

# Set up Nginx
echo "Setting up Nginx..."
cp nginx.conf /etc/nginx/sites-available/itams
ln -s /etc/nginx/sites-available/itams /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo "Deployment completed!"
echo "Application should be accessible at http://10.1.32.66"
echo "Use 'pm2 status' to check application status"
echo "Use 'pm2 logs' to view application logs"