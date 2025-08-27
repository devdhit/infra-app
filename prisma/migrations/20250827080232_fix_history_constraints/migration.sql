-- DropForeignKey
ALTER TABLE "public"."History" DROP CONSTRAINT "history_laptop_fkey";

-- DropForeignKey
ALTER TABLE "public"."History" DROP CONSTRAINT "history_license_fkey";

-- DropForeignKey
ALTER TABLE "public"."History" DROP CONSTRAINT "history_pc_fkey";

-- DropForeignKey
ALTER TABLE "public"."History" DROP CONSTRAINT "history_printer_fkey";

-- DropForeignKey
ALTER TABLE "public"."History" DROP CONSTRAINT "history_warehouse_fkey";

-- CreateIndex
CREATE INDEX "Tenant_id_idx" ON "public"."Tenant"("id");
