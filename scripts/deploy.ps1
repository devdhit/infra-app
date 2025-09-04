# Deployment script for the ITAMS application (Windows)

Write-Host "Starting deployment process..."

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the project root directory."
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..."
npm ci

# Build the application (both Next.js and server-side TypeScript)
Write-Host "Building application..."
npm run build:production

# Check if build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed"
    exit 1
}

# Start the application with PM2
Write-Host "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

Write-Host "Deployment completed successfully!"