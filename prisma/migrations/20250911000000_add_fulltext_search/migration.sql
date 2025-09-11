-- Add search_vector column and GIN index to PC table
ALTER TABLE "PC" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create more efficient function to extract custom field values
CREATE OR REPLACE FUNCTION extract_custom_field_values(custom_fields jsonb) RETURNS text AS $$
DECLARE
  custom_field_values TEXT := '';
BEGIN
  IF custom_fields IS NOT NULL THEN
    SELECT string_agg(value::TEXT, ' ') INTO custom_field_values
    FROM jsonb_each_text(custom_fields);
  END IF;
  RETURN coalesce(custom_field_values, '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create optimized trigger function for PC table
CREATE OR REPLACE FUNCTION update_pc_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW."dept", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."cpuBarcode", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."cpuSapBarcode", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."monitorBarcode", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."monitorSapBarcode", '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW."upsBarcode", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."upsSapBarcode", '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW."pcName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."userName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."status", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."note", '')), 'C') ||
    setweight(to_tsvector('english', extract_custom_field_values(NEW."customFields"::jsonb)), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for PC table
DROP TRIGGER IF EXISTS pc_search_vector_trigger ON "PC";
CREATE TRIGGER pc_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "PC"
  FOR EACH ROW EXECUTE FUNCTION update_pc_search_vector();

-- Create GIN index for PC table
DROP INDEX IF EXISTS "PC_search_vector_idx";
CREATE INDEX "PC_search_vector_idx" ON "PC" USING GIN ("search_vector");

-- Add search_vector column and GIN index to Laptop table
ALTER TABLE "Laptop" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create optimized trigger function for Laptop table
CREATE OR REPLACE FUNCTION update_laptop_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW."dept", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."barcode", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."sapBarcode", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."userName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."email", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."model", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."status", '')), 'B') ||
    setweight(to_tsvector('english', extract_custom_field_values(NEW."customFields"::jsonb)), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for Laptop table
DROP TRIGGER IF EXISTS laptop_search_vector_trigger ON "Laptop";
CREATE TRIGGER laptop_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Laptop"
  FOR EACH ROW EXECUTE FUNCTION update_laptop_search_vector();

-- Create GIN index for Laptop table
DROP INDEX IF EXISTS "Laptop_search_vector_idx";
CREATE INDEX "Laptop_search_vector_idx" ON "Laptop" USING GIN ("search_vector");

-- Add search_vector column and GIN index to Printer table
ALTER TABLE "Printer" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create optimized trigger function for Printer table
CREATE OR REPLACE FUNCTION update_printer_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW."dept", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."location", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."ip", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."model", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."color", '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW."barcode", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."sapCode", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."note", '')), 'C') ||
    setweight(to_tsvector('english', extract_custom_field_values(NEW."customFields"::jsonb)), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for Printer table
DROP TRIGGER IF EXISTS printer_search_vector_trigger ON "Printer";
CREATE TRIGGER printer_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Printer"
  FOR EACH ROW EXECUTE FUNCTION update_printer_search_vector();

-- Create GIN index for Printer table
DROP INDEX IF EXISTS "Printer_search_vector_idx";
CREATE INDEX "Printer_search_vector_idx" ON "Printer" USING GIN ("search_vector");

-- Add search_vector column and GIN index to License table
ALTER TABLE "License" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create optimized trigger function for License table
CREATE OR REPLACE FUNCTION update_license_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW."deviceName", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."userName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."dept", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."productType", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."productKey", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."model", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."pc", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."mac", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."ip", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."updateStatus", '')), 'B') ||
    setweight(to_tsvector('english', extract_custom_field_values(NEW."customFields"::jsonb)), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for License table
DROP TRIGGER IF EXISTS license_search_vector_trigger ON "License";
CREATE TRIGGER license_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "License"
  FOR EACH ROW EXECUTE FUNCTION update_license_search_vector();

-- Create GIN index for License table
DROP INDEX IF EXISTS "License_search_vector_idx";
CREATE INDEX "License_search_vector_idx" ON "License" USING GIN ("search_vector");

-- Add search_vector column and GIN index to WarehouseIT table
ALTER TABLE "WarehouseIT" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create optimized trigger function for WarehouseIT table
CREATE OR REPLACE FUNCTION update_warehouseit_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW."barcode", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."sapCode", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."status", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."note", '')), 'C') ||
    setweight(to_tsvector('english', extract_custom_field_values(NEW."customFields"::jsonb)), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for WarehouseIT table
DROP TRIGGER IF EXISTS warehouseit_search_vector_trigger ON "WarehouseIT";
CREATE TRIGGER warehouseit_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "WarehouseIT"
  FOR EACH ROW EXECUTE FUNCTION update_warehouseit_search_vector();

-- Create GIN index for WarehouseIT table
DROP INDEX IF EXISTS "WarehouseIT_search_vector_idx";
CREATE INDEX "WarehouseIT_search_vector_idx" ON "WarehouseIT" USING GIN ("search_vector");

-- Add search_vector column and GIN index to Internet table
ALTER TABLE "Internet" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create optimized trigger function for Internet table
CREATE OR REPLACE FUNCTION update_internet_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW."dept", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."manager", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."userName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."email", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."ipAddress", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."internetAccess", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."status", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."note", '')), 'C') ||
    setweight(to_tsvector('english', extract_custom_field_values(NEW."customFields"::jsonb)), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for Internet table
DROP TRIGGER IF EXISTS internet_search_vector_trigger ON "Internet";
CREATE TRIGGER internet_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Internet"
  FOR EACH ROW EXECUTE FUNCTION update_internet_search_vector();

-- Create GIN index for Internet table
DROP INDEX IF EXISTS "Internet_search_vector_idx";
CREATE INDEX "Internet_search_vector_idx" ON "Internet" USING GIN ("search_vector");

-- Populate existing records with search vectors
UPDATE "PC" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("dept", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("cpuBarcode", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("cpuSapBarcode", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("monitorBarcode", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("monitorSapBarcode", '')), 'C') ||
  setweight(to_tsvector('english', coalesce("upsBarcode", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("upsSapBarcode", '')), 'C') ||
  setweight(to_tsvector('english', coalesce("pcName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("userName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("status", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("note", '')), 'C') ||
  setweight(to_tsvector('english', extract_custom_field_values("customFields"::jsonb)), 'D');

UPDATE "Laptop" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("dept", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("barcode", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("sapBarcode", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("userName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("email", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("model", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("status", '')), 'B') ||
  setweight(to_tsvector('english', extract_custom_field_values("customFields"::jsonb)), 'D');

UPDATE "Printer" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("dept", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("location", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("ip", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("model", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("color", '')), 'C') ||
  setweight(to_tsvector('english', coalesce("barcode", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("sapCode", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("note", '')), 'C') ||
  setweight(to_tsvector('english', extract_custom_field_values("customFields"::jsonb)), 'D');

UPDATE "License" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("deviceName", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("userName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("dept", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("productType", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("productKey", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("model", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("pc", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("mac", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("ip", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("updateStatus", '')), 'B') ||
  setweight(to_tsvector('english', extract_custom_field_values("customFields"::jsonb)), 'D');

UPDATE "WarehouseIT" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("barcode", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("sapCode", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("status", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("note", '')), 'C') ||
  setweight(to_tsvector('english', extract_custom_field_values("customFields"::jsonb)), 'D');

UPDATE "Internet" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("dept", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("manager", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("userName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("email", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("ipAddress", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("internetAccess", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("status", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("note", '')), 'C') ||
  setweight(to_tsvector('english', extract_custom_field_values("customFields"::jsonb)), 'D');