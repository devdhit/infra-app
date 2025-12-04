-- CreateTable
CREATE TABLE "ITPurchasing" (
    "id" TEXT NOT NULL,
    "bpmName" TEXT NOT NULL,
    "bpmContent" TEXT NOT NULL,
    "bpmId" TEXT NOT NULL,
    "deptCode" TEXT NOT NULL,
    "statusBPM" TEXT NOT NULL,
    "prId" TEXT,
    "statusPR" TEXT,
    "statusReceive" TEXT,
    "dateReceive" TIMESTAMP(3),
    "noted" TEXT,
    "tenantId" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "search_vector" tsvector,

    CONSTRAINT "ITPurchasing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ITPurchasing_tenantId_idx" ON "ITPurchasing"("tenantId");

-- CreateIndex
CREATE INDEX "ITPurchasing_deptCode_idx" ON "ITPurchasing"("deptCode");

-- CreateIndex
CREATE INDEX "ITPurchasing_statusBPM_idx" ON "ITPurchasing"("statusBPM");

-- CreateIndex
CREATE INDEX "ITPurchasing_bpmId_idx" ON "ITPurchasing"("bpmId");

-- CreateIndex
CREATE INDEX "ITPurchasing_prId_idx" ON "ITPurchasing"("prId");

-- CreateIndex
CREATE INDEX "ITPurchasing_createdAt_idx" ON "ITPurchasing"("createdAt");

-- CreateIndex
CREATE INDEX "ITPurchasing_search_vector_idx" ON "ITPurchasing" USING GIN ("search_vector");

-- AddForeignKey
ALTER TABLE "ITPurchasing" ADD CONSTRAINT "ITPurchasing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
