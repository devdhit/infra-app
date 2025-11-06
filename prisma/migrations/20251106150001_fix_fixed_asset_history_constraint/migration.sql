-- Drop the incorrect foreign key constraint that was added in the previous migration
-- This constraint was incorrectly assuming History records only reference FixedAsset records
-- In reality, History records can reference any asset type (PC, Laptop, etc.)

ALTER TABLE "public"."History" DROP CONSTRAINT IF EXISTS "history_fixedasset_fkey";