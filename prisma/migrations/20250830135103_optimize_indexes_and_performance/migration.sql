-- CreateIndex
CREATE INDEX "AuditLogsSettings_tenantId_idx" ON "public"."AuditLogsSettings"("tenantId");

-- CreateIndex
CREATE INDEX "Laptop_status_idx" ON "public"."Laptop"("status");

-- CreateIndex
CREATE INDEX "Laptop_userName_idx" ON "public"."Laptop"("userName");

-- CreateIndex
CREATE INDEX "Laptop_dept_idx" ON "public"."Laptop"("dept");

-- CreateIndex
CREATE INDEX "Laptop_createdAt_idx" ON "public"."Laptop"("createdAt");

-- CreateIndex
CREATE INDEX "Laptop_dateBuy_idx" ON "public"."Laptop"("dateBuy");

-- CreateIndex
CREATE INDEX "License_updateStatus_idx" ON "public"."License"("updateStatus");

-- CreateIndex
CREATE INDEX "License_userName_idx" ON "public"."License"("userName");

-- CreateIndex
CREATE INDEX "License_dept_idx" ON "public"."License"("dept");

-- CreateIndex
CREATE INDEX "License_createdAt_idx" ON "public"."License"("createdAt");

-- CreateIndex
CREATE INDEX "License_productType_idx" ON "public"."License"("productType");

-- CreateIndex
CREATE INDEX "PC_status_idx" ON "public"."PC"("status");

-- CreateIndex
CREATE INDEX "PC_userName_idx" ON "public"."PC"("userName");

-- CreateIndex
CREATE INDEX "PC_dept_idx" ON "public"."PC"("dept");

-- CreateIndex
CREATE INDEX "PC_createdAt_idx" ON "public"."PC"("createdAt");

-- CreateIndex
CREATE INDEX "Printer_dept_idx" ON "public"."Printer"("dept");

-- CreateIndex
CREATE INDEX "Printer_createdAt_idx" ON "public"."Printer"("createdAt");

-- CreateIndex
CREATE INDEX "Printer_barcode_idx" ON "public"."Printer"("barcode");

-- CreateIndex
CREATE INDEX "WarehouseIT_status_idx" ON "public"."WarehouseIT"("status");

-- CreateIndex
CREATE INDEX "WarehouseIT_createdAt_idx" ON "public"."WarehouseIT"("createdAt");
