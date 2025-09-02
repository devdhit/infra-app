# ITAMS Production Deployment Script for Windows
# This script automates the deployment process using PM2 and Nginx

Write-Host "Starting ITAMS production deployment..." -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run as Administrator" -ForegroundColor Red
    exit
}

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit
}

# Check if npm is installed
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit
}

# Install PM2 globally if not present
if (!(Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# Install dependencies
Write-Host "Installing application dependencies..." -ForegroundColor Yellow
npm install --production

# Create production build
Write-Host "Creating production build..." -ForegroundColor Yellow
npm run build

# Set up PM2
Write-Host "Setting up PM2..." -ForegroundColor Yellow
pm2 start ecosystem.config.js
pm2 save

Write-Host "Deployment script completed!" -ForegroundColor Green
Write-Host "Note: For production deployment on Ubuntu with Nginx, please follow the instructions in DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host "Use 'pm2 status' to check application status" -ForegroundColor Cyan
Write-Host "Use 'pm2 logs' to view application logs" -ForegroundColor Cyan