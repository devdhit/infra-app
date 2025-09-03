# ITAMS Auto Deployment System

This document describes the automated deployment system for the IT Asset Management System (ITAMS) that monitors the GitHub repository for changes and automatically deploys updates.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Components](#components)
- [Installation](#installation)
- [Configuration](#configuration)
- [Monitoring and Logs](#monitoring-and-logs)
- [Manual Trigger](#manual-trigger)
- [Troubleshooting](#troubleshooting)

## Overview

The auto-deployment system automatically checks the GitHub repository for changes every 5 minutes. When changes are detected in the `deploy` branch, the system will:

1. Pull the latest changes
2. Install any new dependencies (if package.json changed)
3. Run database migrations (if Prisma schema changed)
4. Rebuild the application
5. Restart the application with PM2

## How It Works

The system uses systemd timers to periodically execute a bash script that:

1. Checks the current commit hash of the local repository
2. Fetches the latest commit hash from the remote `deploy` branch
3. Compares the two hashes to detect changes
4. If changes are detected, updates the repository and deploys the changes

## Components

### 1. Auto-Deployment Script (`scripts/auto-deploy.sh`)

The main script that performs the deployment operations:
- Checks for repository changes
- Pulls updates when changes are detected
- Installs dependencies as needed
- Runs database migrations
- Builds and restarts the application

### 2. Systemd Service (`scripts/itams-auto-deploy.service`)

Defines the service that executes the auto-deployment script.

### 3. Systemd Timer (`scripts/itams-auto-deploy.timer`)

Schedules the auto-deployment service to run every 5 minutes.

### 4. Setup Script (`scripts/setup-auto-deploy.sh`)

Installs and configures the auto-deployment system.

## Installation

### Method 1: Using the Setup Script (Recommended)

1. Navigate to the project directory:
   ```bash
   cd /opt/itams
   ```

2. Run the setup script:
   ```bash
   sudo ./scripts/setup-auto-deploy.sh
   ```

### Method 2: Manual Installation

1. Copy the scripts to appropriate locations:
   ```bash
   # Navigate to the project directory
   cd /opt/itams
   
   # Create necessary directories
   sudo mkdir -p /opt/itams/scripts
   sudo mkdir -p /var/log
   sudo mkdir -p /var/run
   
   # Copy scripts to the appropriate locations
   sudo cp scripts/auto-deploy.sh /opt/itams/scripts/
   sudo cp scripts/itams-auto-deploy.service /etc/systemd/system/
   sudo cp scripts/itams-auto-deploy.timer /etc/systemd/system/
   ```

2. Make the script executable:
   ```bash
   sudo chmod +x /opt/itams/scripts/auto-deploy.sh
   ```

3. Reload systemd and enable the timer:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable itams-auto-deploy.timer
   sudo systemctl start itams-auto-deploy.timer
   ```

## Configuration

The auto-deployment script can be configured by modifying the variables at the top of `auto-deploy.sh`:

- `REPO_URL`: The GitHub repository URL
- `DEPLOY_BRANCH`: The branch to monitor for changes
- `LOCAL_REPO_DIR`: The local directory where the repository is cloned
- `LOG_FILE`: The log file location
- `LAST_COMMIT_FILE`: File to store the last deployed commit hash

## Monitoring and Logs

### Check Timer Status
```bash
systemctl status itams-auto-deploy.timer
```

### View Timer Schedule
```bash
systemctl list-timers itams-auto-deploy.timer
```

### View Logs
```bash
# View recent logs
tail -f /var/log/itams-auto-deploy.log

# View all logs
cat /var/log/itams-auto-deploy.log
```

### View Service Logs
```bash
journalctl -u itams-auto-deploy.service -f
```

## Manual Trigger

To manually trigger a deployment check:
```bash
sudo systemctl start itams-auto-deploy.service
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**:
   Ensure the script is executable and running as root:
   ```bash
   sudo chmod +x /opt/itams/scripts/auto-deploy.sh
   ```

2. **Git Authentication Issues**:
   If using a private repository, configure git credentials:
   ```bash
   git config --global credential.helper store
   ```

3. **PM2 Not Found**:
   Ensure PM2 is installed globally:
   ```bash
   sudo npm install -g pm2
   ```

4. **Database Migration Issues**:
   Check database connectivity and credentials in the environment file.

### Log Analysis

Check the log file for detailed information about deployment attempts:
```bash
tail -n 50 /var/log/itams-auto-deploy.log
```

Look for:
- "New changes detected" messages
- Error messages
- Successful deployment confirmations

### Disabling Auto Deployment

To temporarily stop auto-deployment:
```bash
sudo systemctl stop itams-auto-deploy.timer
```

To permanently disable:
```bash
sudo systemctl disable itams-auto-deploy.timer
```

## Security Considerations

1. **Repository Access**: 
   - The system uses HTTPS to access the repository
   - For private repositories, configure appropriate authentication

2. **Permissions**:
   - The script runs as root to ensure it has necessary permissions
   - Limit access to the script files

3. **Network Security**:
   - Ensure the server can access GitHub
   - Consider using GitHub deploy keys for better security

## Customization

You can customize the deployment frequency by modifying the timer:
```ini
# In /etc/systemd/system/itams-auto-deploy.timer
[Timer]
OnCalendar=*:0/5  # Every 5 minutes
```

Options:
- `*:0/1` - Every minute
- `*:0/10` - Every 10 minutes
- `hourly` - Every hour
- `daily` - Daily

Refer to systemd documentation for more scheduling options.