-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PC" (
    "id" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "cpuBarcode" TEXT NOT NULL,
    "cpuSapBarcode" TEXT,
    "monitorBarcode" TEXT,
    "monitorSapBarcode" TEXT,
    "upsBarcode" TEXT,
    "upsSapBarcode" TEXT,
    "pcName" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "note" TEXT,
    "tenantId" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Laptop" (
    "id" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "sapBarcode" TEXT,
    "dateBuy" TIMESTAMP(3),
    "userId" TEXT,
    "email" TEXT,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "tenantId" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Laptop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Printer" (
    "id" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "location" TEXT,
    "ip" TEXT,
    "model" TEXT,
    "color" BOOLEAN NOT NULL DEFAULT false,
    "barcode" TEXT NOT NULL,
    "sapCode" TEXT,
    "date" TIMESTAMP(3),
    "note" TEXT,
    "tenantId" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."License" (
    "id" TEXT NOT NULL,
    "deviceName" TEXT,
    "userName" TEXT,
    "dept" TEXT,
    "productType" TEXT,
    "productKey" TEXT,
    "model" TEXT,
    "pc" TEXT,
    "mac" TEXT,
    "ip" TEXT,
    "date" TIMESTAMP(3),
    "updateStatus" TEXT DEFAULT 'active',
    "tenantId" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WarehouseIT" (
    "id" TEXT NOT NULL,
    "cpuBarcode" TEXT,
    "cpuSapBarcode" TEXT,
    "monitorBarcode" TEXT,
    "monitorSapBarcode" TEXT,
    "upsBarcode" TEXT,
    "upsSapBarcode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "note" TEXT,
    "tenantId" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseIT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomField" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."History" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "public"."User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PC_cpuBarcode_key" ON "public"."PC"("cpuBarcode");

-- CreateIndex
CREATE INDEX "PC_tenantId_idx" ON "public"."PC"("tenantId");

-- CreateIndex
CREATE INDEX "PC_userId_idx" ON "public"."PC"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Laptop_barcode_key" ON "public"."Laptop"("barcode");

-- CreateIndex
CREATE INDEX "Laptop_tenantId_idx" ON "public"."Laptop"("tenantId");

-- CreateIndex
CREATE INDEX "Laptop_userId_idx" ON "public"."Laptop"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Printer_barcode_key" ON "public"."Printer"("barcode");

-- CreateIndex
CREATE INDEX "Printer_tenantId_idx" ON "public"."Printer"("tenantId");

-- CreateIndex
CREATE INDEX "License_tenantId_idx" ON "public"."License"("tenantId");

-- CreateIndex
CREATE INDEX "WarehouseIT_tenantId_idx" ON "public"."WarehouseIT"("tenantId");

-- CreateIndex
CREATE INDEX "CustomField_tenantId_idx" ON "public"."CustomField"("tenantId");

-- CreateIndex
CREATE INDEX "CustomField_modelType_idx" ON "public"."CustomField"("modelType");

-- CreateIndex
CREATE INDEX "History_tenantId_idx" ON "public"."History"("tenantId");

-- CreateIndex
CREATE INDEX "History_userId_idx" ON "public"."History"("userId");

-- CreateIndex
CREATE INDEX "History_modelType_recordId_idx" ON "public"."History"("modelType", "recordId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PC" ADD CONSTRAINT "PC_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PC" ADD CONSTRAINT "PC_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Laptop" ADD CONSTRAINT "Laptop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Laptop" ADD CONSTRAINT "Laptop_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Printer" ADD CONSTRAINT "Printer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."License" ADD CONSTRAINT "License_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WarehouseIT" ADD CONSTRAINT "WarehouseIT_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomField" ADD CONSTRAINT "CustomField_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."History" ADD CONSTRAINT "History_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."History" ADD CONSTRAINT "history_pc_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."PC"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."History" ADD CONSTRAINT "history_laptop_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."Laptop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."History" ADD CONSTRAINT "history_printer_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."Printer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."History" ADD CONSTRAINT "history_license_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."License"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."History" ADD CONSTRAINT "history_warehouse_fkey" FOREIGN KEY ("recordId") REFERENCES "public"."WarehouseIT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
