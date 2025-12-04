/**
 * Zod validation schemas for management operations
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { z } from 'zod';
import { RESOURCE_TYPES, PERMISSION_ACTIONS } from '@/types/management';

/**
 * Common validation schemas
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(255, 'Email must be less than 255 characters')
  .email('Invalid email format')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
    'Password must contain uppercase, lowercase, number, and special character'
  );

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .trim();

export const descriptionSchema = z
  .string()
  .max(500, 'Description must be less than 500 characters')
  .nullable()
  .optional();

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

/**
 * Tenant validation schemas
 */
export const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, 'Tenant name is required')
    .max(100, 'Tenant name must be less than 100 characters')
    .trim(),
  description: descriptionSchema,
});

export const updateTenantSchema = z.object({
  name: z
    .string()
    .min(1, 'Tenant name is required')
    .max(100, 'Tenant name must be less than 100 characters')
    .trim()
    .optional(),
  description: descriptionSchema,
});

export const tenantFilterSchema = z.object({
  search: z.string().optional(),
  hasUsers: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

/**
 * Role validation schemas
 */
export const resourceTypeSchema = z.enum(RESOURCE_TYPES as unknown as readonly [string, ...string[]]);

export const permissionActionSchema = z.enum(PERMISSION_ACTIONS as unknown as readonly [string, ...string[]]);

export const rolePermissionsSchema = z.record(
  resourceTypeSchema,
  z.array(permissionActionSchema)
);

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(50, 'Role name must be less than 50 characters')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, hyphens, and underscores'),
  description: descriptionSchema,
  permissions: rolePermissionsSchema,
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(50, 'Role name must be less than 50 characters')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, hyphens, and underscores')
    .optional(),
  description: descriptionSchema,
  permissions: rolePermissionsSchema.optional(),
});

export const permissionCheckSchema = z.object({
  roleId: uuidSchema,
  tenantId: uuidSchema,
  resource: resourceTypeSchema,
  action: permissionActionSchema,
});

/**
 * User validation schemas
 */
export const createUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  roleId: uuidSchema.optional(),
  tenantId: uuidSchema.optional(),
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  name: nameSchema.optional(),
  password: z.string().min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      'Password must contain uppercase, lowercase, number, and special character'
    )
    .or(z.literal('')) // Allow empty string to mean "don't change password"
    .optional(),
  roleId: uuidSchema.optional(),
  tenantId: uuidSchema.optional(), // Add tenantId to allow tenant updates
});

export const loginCredentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const userProfileUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const userFilterSchema = z.object({
  search: z.string().optional(),
  roleId: uuidSchema.optional(),
  tenantId: uuidSchema.optional(),
  isLocked: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

export const userUnlockSchema = z.object({
  userId: uuidSchema,
  reason: z.string().max(500).optional(),
});

/**
 * Bulk operation schemas
 */
export const bulkDeleteSchema = z.object({
  ids: z.array(uuidSchema).min(1, 'At least one ID is required').max(100, 'Cannot delete more than 100 items at once'),
});

/**
 * Type inference helpers
 */
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type TenantFilterInput = z.infer<typeof tenantFilterSchema>;

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type PermissionCheckInput = z.infer<typeof permissionCheckSchema>;

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginCredentialsInput = z.infer<typeof loginCredentialsSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
export type UserUnlockInput = z.infer<typeof userUnlockSchema>;

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
