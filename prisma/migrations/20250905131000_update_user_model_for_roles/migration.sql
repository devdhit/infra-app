-- Add roleId column to User table
ALTER TABLE "public"."User" ADD COLUMN "roleId" TEXT;

-- Remove the old role column
ALTER TABLE "public"."User" DROP COLUMN "role";

-- Create index for roleId
CREATE INDEX "User_roleId_idx" ON "public"."User"("roleId");

-- Add foreign key constraint
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;