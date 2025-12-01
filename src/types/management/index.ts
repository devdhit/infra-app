/**
 * Management module type definitions
 * Central export point for all management-related types
 */

// Common types
export type {
  ISODateString,
  UUID,
  BaseEntity,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  ValidationErrorDetail,
  Result,
} from './common';

export { ApiErrorCode } from './common';

// Tenant types
export type {
  Tenant,
  TenantCounts,
  TenantWithDetails,
  CreateTenantData,
  UpdateTenantData,
  TenantFilterParams,
  TenantListItem,
  TenantDeletionResult,
  TenantStatistics,
} from './tenant';

// Role types
export type {
  ResourceType,
  PermissionAction,
  RolePermissions,
  Role,
  RoleWithUsers,
  CreateRoleData,
  UpdateRoleData,
  PermissionCheckParams,
  PermissionCheckResult,
  DefaultRolePermissions,
  RoleAssignment,
  PermissionMatrix,
  RoleValidationResult,
} from './role';

export { RESOURCE_TYPES, PERMISSION_ACTIONS } from './role';

// User types
export type {
  User,
  UserWithRole,
  UserWithDetails,
  UserFromDatabase,
  CreateUserData,
  UpdateUserData,
  UserLoginCredentials,
  UserJwtPayload,
  AuthTokenResponse,
  UserProfileUpdateData,
  PasswordChangeData,
  UserFilterParams,
  UserListItem,
  UserUnlockRequest,
  UserUnlockResponse,
  UserSession,
  UserActivity,
  UserValidationResult,
  PasswordValidationResult,
} from './user';
