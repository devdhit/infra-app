/*
  Warnings:

  - You are about to drop the column `cpuBarcode` on the `WarehouseIT` table. All the data in the column will be lost.
  - You are about to drop the column `cpuSapBarcode` on the `WarehouseIT` table. All the data in the column will be lost.
  - You are about to drop the column `monitorBarcode` on the `WarehouseIT` table. All the data in the column will be lost.
  - You are about to drop the column `monitorSapBarcode` on the `WarehouseIT` table. All the data in the column will be lost.
  - You are about to drop the column `upsBarcode` on the `WarehouseIT` table. All the data in the column will be lost.
  - You are about to drop the column `upsSapBarcode` on the `WarehouseIT` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."History" DROP CONSTRAINT "history_internet_fkey";

-- DropIndex
DROP INDEX "public"."Internet_customFields_idx";

-- DropIndex
DROP INDEX "public"."Laptop_customFields_idx";

-- DropIndex
DROP INDEX "public"."License_customFields_idx";

-- DropIndex
DROP INDEX "public"."PC_customFields_idx";

-- DropIndex
DROP INDEX "public"."Printer_customFields_idx";

-- DropIndex
DROP INDEX "public"."WarehouseIT_customFields_idx";

-- AlterTable
ALTER TABLE "public"."Internet" ALTER COLUMN "status" SET DEFAULT 'working';

-- AlterTable
ALTER TABLE "public"."WarehouseIT" DROP COLUMN "cpuBarcode",
DROP COLUMN "cpuSapBarcode",
DROP COLUMN "monitorBarcode",
DROP COLUMN "monitorSapBarcode",
DROP COLUMN "upsBarcode",
DROP COLUMN "upsSapBarcode",
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "sapCode" TEXT;

-- CreateIndex
CREATE INDEX "Internet_email_idx" ON "public"."Internet"("email");

-- CreateIndex
CREATE INDEX "Internet_ipAddress_idx" ON "public"."Internet"("ipAddress");

-- CreateIndex
CREATE INDEX "Internet_createdAt_idx" ON "public"."Internet"("createdAt");
