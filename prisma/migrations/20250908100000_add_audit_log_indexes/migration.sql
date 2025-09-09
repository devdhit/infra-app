-- Add indexes for better audit log performance
CREATE INDEX IF NOT EXISTS "History_tenantId_action_idx" ON "History"("tenantId", "action");
CREATE INDEX IF NOT EXISTS "History_tenantId_modelType_idx" ON "History"("tenantId", "modelType");
CREATE INDEX IF NOT EXISTS "History_tenantId_userId_idx" ON "History"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "History_createdAt_idx" ON "History"("createdAt");