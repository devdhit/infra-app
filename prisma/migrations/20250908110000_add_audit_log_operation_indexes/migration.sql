-- Add indexes for better audit log performance for new operations
CREATE INDEX IF NOT EXISTS "History_action_idx" ON "History"("action");
CREATE INDEX IF NOT EXISTS "History_modelType_action_idx" ON "History"("modelType", "action");