-- AlterTable
ALTER TABLE "public"."Internet" ALTER COLUMN "status" SET DEFAULT 'working';

-- CreateIndex
CREATE INDEX "Internet_email_idx" ON "public"."Internet"("email");

-- CreateIndex
CREATE INDEX "Internet_ipAddress_idx" ON "public"."Internet"("ipAddress");

-- CreateIndex
CREATE INDEX "Internet_createdAt_idx" ON "public"."Internet"("createdAt");
