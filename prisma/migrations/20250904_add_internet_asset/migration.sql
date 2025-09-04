-- CreateTable
CREATE TABLE "public"."Internet" (
    "id" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "manager" TEXT,
    "userName" TEXT,
    "email" TEXT,
    "ipAddress" TEXT,
    "internetAccess" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "note" TEXT,
    "tenantId" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Internet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Internet_tenantId_idx" ON "public"."Internet"("tenantId");

-- CreateIndex
CREATE INDEX "Internet_userName_idx" ON "public"."Internet"("userName");

-- CreateIndex
CREATE INDEX "Internet_dept_idx" ON "public"."Internet"("dept");

-- CreateIndex
CREATE INDEX "Internet_status_idx" ON "public"."Internet"("status");

-- AddForeignKey
ALTER TABLE "public"."Internet" ADD CONSTRAINT "Internet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."History" ADD CONSTRAINT "history_internet_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."Internet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;