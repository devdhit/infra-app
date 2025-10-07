-- DropIndex
DROP INDEX "public"."Laptop_barcode_key";

-- AlterTable
ALTER TABLE "PC" ALTER COLUMN "cpuBarcode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Printer" ALTER COLUMN "barcode" DROP NOT NULL;
