-- Fix user role permissions to include roles view permission
UPDATE "public"."Role"
SET "permissions" = jsonb_set(
  "permissions",
  '{roles}',
  '["view"]'::jsonb
)
WHERE "name" = 'user' AND ("permissions"->>'roles' IS NULL OR jsonb_array_length("permissions"->'roles') = 0);