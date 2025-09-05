-- CreateIndex for customFields JSONB search optimization
CREATE INDEX "PC_customFields_idx" ON "public"."PC" USING GIN ("customFields" jsonb_path_ops);
CREATE INDEX "Laptop_customFields_idx" ON "public"."Laptop" USING GIN ("customFields" jsonb_path_ops);
CREATE INDEX "Printer_customFields_idx" ON "public"."Printer" USING GIN ("customFields" jsonb_path_ops);
CREATE INDEX "License_customFields_idx" ON "public"."License" USING GIN ("customFields" jsonb_path_ops);
CREATE INDEX "WarehouseIT_customFields_idx" ON "public"."WarehouseIT" USING GIN ("customFields" jsonb_path_ops);
CREATE INDEX "Internet_customFields_idx" ON "public"."Internet" USING GIN ("customFields" jsonb_path_ops);