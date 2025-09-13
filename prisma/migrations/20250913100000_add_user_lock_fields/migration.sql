-- Add columns to track user lock status and failed login attempts
ALTER TABLE "public"."User" 
ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedAt" TIMESTAMP(3),
ADD COLUMN "lockedUntil" TIMESTAMP(3),
ADD COLUMN "lastLoginAttempt" TIMESTAMP(3);