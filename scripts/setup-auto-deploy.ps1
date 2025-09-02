# Setup script for ITAMS Auto Deployment System (PowerShell version)

Write-Host "Setting up ITAMS Auto Deployment System..." -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run as Administrator" -ForegroundColor Red
    exit 1
}

# Create necessary directories
New-Item -ItemType Directory -Path "/opt/itams/scripts" -Force | Out-Null
New-Item -ItemType Directory -Path "/var/log" -Force | Out-Null
New-Item -ItemType Directory -Path "/var/run" -Force | Out-Null

# Copy scripts to the appropriate locations
Copy-Item -Path "./auto-deploy.ps1" -Destination "/opt/itams/scripts/"
Copy-Item -Path "./itams-auto-deploy.service" -Destination "/etc/systemd/system/"
Copy-Item -Path "./itams-auto-deploy.timer" -Destination "/etc/systemd/system/"

Write-Host "ITAMS Auto Deployment System setup completed!" -ForegroundColor Green
Write-Host "Note: This system is designed for Linux environments with systemd." -ForegroundColor Yellow
Write-Host "For Windows environments, you would need to use Task Scheduler or a similar service." -ForegroundColor Yellow