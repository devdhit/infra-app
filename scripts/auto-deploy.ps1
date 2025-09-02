# Auto-deployment script for ITAMS (PowerShell version)
# Checks for changes in the GitHub repository and automatically deploys updates

# Configuration
$RepoUrl = "https://github.com/ddthien-coder/infra-app"
$DeployBranch = "deploy"
$LocalRepoDir = "/opt/itams"
$LogFile = "/var/log/itams-auto-deploy.log"
$LastCommitFile = "/opt/itams/.last_commit"
$LockFile = "/var/run/itams-auto-deploy.lock"

# Logging function
function Log-Message {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "$Timestamp - $Message"
    Add-Content -Path $LogFile -Value $LogEntry
    Write-Host $LogEntry
}

# Error handling function
function Exit-WithError {
    param([string]$Message)
    Log-Message "ERROR: $Message"
    Remove-Item -Path $LockFile -ErrorAction SilentlyContinue
    exit 1
}

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Exit-WithError "Please run as Administrator"
}

# Check if git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Log-Message "Git is not installed. Please install Git first."
    Exit-WithError "Git not found"
}

Log-Message "Starting auto-deployment check..."

# Create log directory if it doesn't exist
$LogDir = Split-Path $LogFile -Parent
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Check if local repository exists
if (!(Test-Path $LocalRepoDir)) {
    Log-Message "Local repository directory does not exist. Cloning repository..."
    New-Item -ItemType Directory -Path $LocalRepoDir -Force | Out-Null
    
    # Clone repository
    Set-Location /tmp
    git clone $RepoUrl $LocalRepoDir
    if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to clone repository" }
    
    Set-Location $LocalRepoDir
    git checkout $DeployBranch
    if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to checkout $DeployBranch branch" }
    
    # Record initial commit
    $InitialCommit = git rev-parse HEAD
    Set-Content -Path $LastCommitFile -Value $InitialCommit
    if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to record initial commit" }
    
    Log-Message "Repository cloned successfully"
    
    # Install dependencies
    Log-Message "Installing dependencies..."
    npm install --production
    if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to install dependencies" }
    
    # Run database setup
    Log-Message "Setting up database..."
    npx prisma generate
    if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to generate Prisma client" }
    
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to run database migrations" }
    
    # Build the application
    Log-Message "Building application..."
    npm run build
    if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to build application" }
    
    # Start the application with PM2
    Log-Message "Starting application with PM2..."
    pm2 start /opt/itams/ecosystem.config.js
    if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to start application with PM2" }
    
    Log-Message "Initial deployment completed successfully!"
} else {
    Log-Message "Local repository exists. Checking for updates..."
    Set-Location $LocalRepoDir
    
    # Store current commit before updating
    $CurrentCommit = git rev-parse HEAD
    
    # Fetch latest changes
    git fetch origin $DeployBranch
    if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to fetch from repository" }
    
    # Get the latest commit hash from remote
    $RemoteCommit = git rev-parse origin/$DeployBranch
    
    # Get the last deployed commit hash
    if (Test-Path $LastCommitFile) {
        $LastCommit = Get-Content -Path $LastCommitFile
    } else {
        # If no last commit file, use current commit
        $LastCommit = $CurrentCommit
        Set-Content -Path $LastCommitFile -Value $LastCommit
    }
    
    Log-Message "Current commit: $CurrentCommit"
    Log-Message "Remote commit: $RemoteCommit"
    Log-Message "Last deployed commit: $LastCommit"
    
    # Compare commits
    if ($RemoteCommit -ne $LastCommit) {
        Log-Message "New changes detected. Updating repository..."
        
        # Stash any local changes
        git stash
        if ($LASTEXITCODE -ne 0) { Log-Message "Warning: Failed to stash local changes" }
        
        # Pull the latest changes
        git pull origin $DeployBranch
        if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to pull latest changes" }
        
        # Update last commit file
        Set-Content -Path $LastCommitFile -Value $RemoteCommit
        if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to update last commit file" }
        
        Log-Message "Repository updated successfully. Deploying changes..."
        
        # Check if package.json was modified
        $PackageJsonChanged = git diff --quiet $LastCommit $RemoteCommit -- package.json
        if ($LASTEXITCODE -ne 0) {
            Log-Message "package.json changed. Installing dependencies..."
            npm install --production
            if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to install dependencies" }
        }
        
        # Check if Prisma schema was modified
        $PrismaSchemaChanged = git diff --quiet $LastCommit $RemoteCommit -- prisma/schema.prisma
        if ($LASTEXITCODE -ne 0) {
            Log-Message "Prisma schema changed. Running migrations..."
            npx prisma generate
            if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to generate Prisma client" }
            
            npx prisma migrate deploy
            if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to run database migrations" }
        } else {
            # Always generate Prisma client to be safe
            npx prisma generate
            if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to generate Prisma client" }
        }
        
        # Build the application
        Log-Message "Building application..."
        npm run build
        if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to build application" }
        
        # Restart the application with PM2
        Log-Message "Restarting application with PM2..."
        pm2 restart itams
        if ($LASTEXITCODE -ne 0) { Exit-WithError "Failed to restart application with PM2" }
        
        Log-Message "Deployment completed successfully!"
    } else {
        Log-Message "No new changes detected. Nothing to deploy."
    }
}

Log-Message "Auto-deployment check completed."