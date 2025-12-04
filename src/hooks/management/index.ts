/**
 * Management Hooks - Type-safe React hooks for management operations
 */

// Export all tenant hooks
export {
  useTenants,
  useTenant,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
} from './use-tenants';

// Export all role hooks
export {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useBulkDeleteRoles,
} from './use-roles';

// Export all user hooks
export {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useBulkDeleteUsers,
  useChangePassword,
  useLockUser,
  useUnlockUser,
} from './use-users';
