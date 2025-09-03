# Script to clear Next.js build cache and rebuild

Write-Host "Clearing Next.js build cache..." -ForegroundColor Green

# Remove Next.js build directory
if (Test-Path ".next") {
    Write-Host "Removing .next directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
    Write-Host ".next directory removed." -ForegroundColor Green
} else {
    Write-Host ".next directory not found." -ForegroundColor Yellow
}

# Remove node_modules and reinstall (optional, uncomment if needed)
# Write-Host "Removing node_modules directory..." -ForegroundColor Yellow
# Remove-Item -Recurse -Force node_modules
# Write-Host "node_modules directory removed." -ForegroundColor Green
# Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
# npm install --production

# Regenerate Prisma client
Write-Host "Regenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "Build cache cleared. You can now run 'npm run build' to rebuild the project." -ForegroundColor Green