-- CreateTable
CREATE TABLE "public"."FixedAsset" (
    "id" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "barcode" TEXT,
    "sapCode" TEXT,
    "name" TEXT NOT NULL,
    "place" TEXT,
    "inputDate" TIMESTAMP(3),
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'working',
    "note" TEXT,
    "tenantId" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixedAsset_tenantId_idx" ON "public"."FixedAsset"("tenantId");

-- CreateIndex
CREATE INDEX "FixedAsset_dept_idx" ON "public"."FixedAsset"("dept");

-- CreateIndex
CREATE INDEX "FixedAsset_status_idx" ON "public"."FixedAsset"("status");

-- CreateIndex
CREATE INDEX "FixedAsset_barcode_idx" ON "public"."FixedAsset"("barcode");

-- CreateIndex
CREATE INDEX "FixedAsset_sapCode_idx" ON "public"."FixedAsset"("sapCode");

-- CreateIndex
CREATE INDEX "FixedAsset_createdAt_idx" ON "public"."FixedAsset"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."FixedAsset" ADD CONSTRAINT "FixedAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;