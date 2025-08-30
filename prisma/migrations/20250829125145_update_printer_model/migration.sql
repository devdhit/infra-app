-- DropIndex
DROP INDEX "public"."Printer_barcode_key";

-- AlterTable
ALTER TABLE "public"."Printer" ALTER COLUMN "color" SET DEFAULT 'Black & White',
ALTER COLUMN "color" SET DATA TYPE TEXT;
