# User Unlock Feature

## Overview
This feature allows administrators to unlock user accounts that have been locked due to too many failed login attempts. When a user exceeds the maximum allowed failed login attempts (5 by default), their account will be locked for 24 hours. Administrators can manually unlock these accounts before the lockout period expires.

## Implementation Details

### Database Changes
Added the following fields to the User model:
- `failedLoginAttempts`: Integer - Tracks the number of consecutive failed login attempts
- `lockedAt`: DateTime - Timestamp when the account was locked
- `lockedUntil`: DateTime - Timestamp when the lockout period will expire
- `lastLoginAttempt`: DateTime - Timestamp of the last login attempt

### Login Route Changes
The login route (`/api/auth/login`) now:
1. Checks if the user account is currently locked
2. Increments failed login attempts on invalid password
3. Locks the account when failed attempts exceed the threshold
4. Resets failed attempts and lock status on successful login

### Unlock API Endpoint
A new API endpoint has been added:
- `POST /api/users/[id]/unlock` - Unlocks a user account by resetting the failed login attempts and lock timestamps

### Frontend Changes
- Added "Unlock Account" option to the user dropdown menu in the users table
- Created a new hook `useUnlockUser` for handling the unlock API call
- Added translation strings for unlock functionality in both English and Chinese

## Usage

### Unlocking a User Account
1. Navigate to the Users page
2. Find the locked user in the table
3. Click the dropdown menu for that user
4. Select "Unlock Account"
5. The user will receive a success notification when the account is unlocked

### Permissions
Only users with the "manage users" permission can unlock accounts. This typically includes administrators.

## Configuration
The lockout settings can be adjusted in the login route:
- `MAX_ATTEMPTS`: Maximum failed login attempts before locking (default: 5)
- `ACCOUNT_LOCKOUT_DURATION`: Duration of lockout period in milliseconds (default: 24 hours)

## Security Considerations
- All unlock actions are logged in the audit trail
- Only authorized users can unlock accounts
- The unlock endpoint requires proper authentication and authorization