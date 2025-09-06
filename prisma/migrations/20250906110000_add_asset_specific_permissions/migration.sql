-- This migration updates existing roles to include asset-specific permissions
-- It maintains backward compatibility by copying generic asset permissions to specific asset types

-- First, let's create a function to update role permissions
-- This function will add asset-specific permissions based on existing generic asset permissions
DO $$
DECLARE
    role_record RECORD;
    updated_permissions JSONB;
BEGIN
    -- Loop through all roles
    FOR role_record IN 
        SELECT id, permissions FROM "public"."Role"
    LOOP
        -- Get current permissions
        updated_permissions := role_record.permissions;
        
        -- If the role has assets permissions, copy them to specific asset types
        IF updated_permissions ? 'assets' THEN
            -- Copy assets permissions to each specific asset type
            updated_permissions := updated_permissions || 
                jsonb_build_object(
                    'pc', updated_permissions->'assets',
                    'laptop', updated_permissions->'assets',
                    'printer', updated_permissions->'assets',
                    'license', updated_permissions->'assets',
                    'warehouse', updated_permissions->'assets',
                    'internet', updated_permissions->'assets'
                );
        ELSE
            -- If no generic assets permissions, set empty arrays for specific asset types
            updated_permissions := updated_permissions || 
                jsonb_build_object(
                    'pc', '[]'::jsonb,
                    'laptop', '[]'::jsonb,
                    'printer', '[]'::jsonb,
                    'license', '[]'::jsonb,
                    'warehouse', '[]'::jsonb,
                    'internet', '[]'::jsonb
                );
        END IF;
        
        -- Update the role with new permissions
        UPDATE "public"."Role" 
        SET permissions = updated_permissions 
        WHERE id = role_record.id;
    END LOOP;
END $$;