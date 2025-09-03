#!/bin/bash

# Auto-deployment script for ITAMS
# Checks for changes in the GitHub repository and automatically deploys updates

# Configuration
REPO_URL="https://github.com/ddthien-coder/infra-app"
DEPLOY_BRANCH="deploy"
LOCAL_REPO_DIR="/opt/itams"
LOG_FILE="/var/log/itams-auto-deploy.log"
LAST_COMMIT_FILE="/opt/itams/.last_commit"
LOCK_FILE="/var/run/itams-auto-deploy.lock"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Error handling function
error_exit() {
    log "ERROR: $1"
    rm -f $LOCK_FILE
    exit 1
}

# Cleanup function
cleanup() {
    rm -f $LOCK_FILE
    exit
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Check if another instance is running
if [ -f "$LOCK_FILE" ]; then
    log "Another instance is already running. Exiting."
    exit 0
fi

# Create lock file
echo $$ > $LOCK_FILE

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error_exit "Please run as root (sudo)"
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    log "Git is not installed. Installing git..."
    apt update && apt install -y git || error_exit "Failed to install git"
fi

log "Starting auto-deployment check..."

# Create log directory if it doesn't exist
mkdir -p $(dirname $LOG_FILE)

# Check if local repository exists
if [ ! -d "$LOCAL_REPO_DIR" ]; then
    log "Local repository directory does not exist. Cloning repository..."
    mkdir -p $LOCAL_REPO_DIR || error_exit "Failed to create directory $LOCAL_REPO_DIR"
    
    # Clone repository
    cd /tmp || error_exit "Failed to change to /tmp directory"
    git clone $REPO_URL $LOCAL_REPO_DIR || error_exit "Failed to clone repository"
    
    cd $LOCAL_REPO_DIR || error_exit "Failed to change to repository directory"
    
    # Checkout deploy branch
    git checkout $DEPLOY_BRANCH || error_exit "Failed to checkout $DEPLOY_BRANCH branch"
    
    # Record initial commit
    echo $(git rev-parse HEAD) > $LAST_COMMIT_FILE || error_exit "Failed to record initial commit"
    
    log "Repository cloned successfully"
    
    # Install dependencies
    log "Installing dependencies..."
    npm install --production || error_exit "Failed to install dependencies"
    
    # Run database setup
    log "Setting up database..."
    npx prisma generate || error_exit "Failed to generate Prisma client"
    npx prisma migrate deploy || error_exit "Failed to run database migrations"
    
    # Build the application
    log "Building application..."
    npm run build || error_exit "Failed to build application"
    
    # Start the application with PM2
    log "Starting application with PM2..."
    pm2 start $LOCAL_REPO_DIR/ecosystem.config.js || error_exit "Failed to start application with PM2"
    
    log "Initial deployment completed successfully!"
else
    log "Local repository exists. Checking for updates..."
    cd $LOCAL_REPO_DIR || error_exit "Failed to change to repository directory"
    
    # Store current commit before updating
    CURRENT_COMMIT=$(git rev-parse HEAD)
    
    # Fetch latest changes
    git fetch origin $DEPLOY_BRANCH || error_exit "Failed to fetch from repository"
    
    # Get the latest commit hash from remote
    REMOTE_COMMIT=$(git rev-parse origin/$DEPLOY_BRANCH)
    
    # Get the last deployed commit hash
    if [ -f "$LAST_COMMIT_FILE" ]; then
        LAST_COMMIT=$(cat $LAST_COMMIT_FILE)
    else
        # If no last commit file, use current commit
        LAST_COMMIT=$CURRENT_COMMIT
        echo $LAST_COMMIT > $LAST_COMMIT_FILE
    fi
    
    log "Current commit: $CURRENT_COMMIT"
    log "Remote commit: $REMOTE_COMMIT"
    log "Last deployed commit: $LAST_COMMIT"
    
    # Compare commits
    if [ "$REMOTE_COMMIT" != "$LAST_COMMIT" ]; then
        log "New changes detected. Updating repository..."
        
        # Stash any local changes
        git stash || log "Warning: Failed to stash local changes"
        
        # Pull the latest changes
        git pull origin $DEPLOY_BRANCH || error_exit "Failed to pull latest changes"
        
        # Update last commit file
        echo $REMOTE_COMMIT > $LAST_COMMIT_FILE || error_exit "Failed to update last commit file"
        
        log "Repository updated successfully. Deploying changes..."
        
        # Check if package.json was modified
        if ! git diff --quiet $LAST_COMMIT $REMOTE_COMMIT -- package.json; then
            log "package.json changed. Installing dependencies..."
            npm install --production || error_exit "Failed to install dependencies"
        fi
        
        # Check if Prisma schema was modified
        if ! git diff --quiet $LAST_COMMIT $REMOTE_COMMIT -- prisma/schema.prisma; then
            log "Prisma schema changed. Running migrations..."
            npx prisma generate || error_exit "Failed to generate Prisma client"
            npx prisma migrate deploy || error_exit "Failed to run database migrations"
        else
            # Always generate Prisma client to be safe
            npx prisma generate || error_exit "Failed to generate Prisma client"
        fi
        
        # Build the application
        log "Building application..."
        npm run build || error_exit "Failed to build application"
        
        # Restart the application with PM2
        log "Restarting application with PM2..."
        pm2 restart itams || error_exit "Failed to restart application with PM2"
        
        log "Deployment completed successfully!"
        
        # Send notification (optional)
        # You can add email or webhook notifications here
    else
        log "No new changes detected. Nothing to deploy."
    fi
fi

log "Auto-deployment check completed."