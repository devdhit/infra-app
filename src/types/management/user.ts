/**
 * User type definitions
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { BaseEntity, UUID, ISODateString } from './common';
import { Role } from './role';
import { Tenant } from './tenant';

/**
 * User entity from database (without sensitive data)
 */
export interface User extends BaseEntity {
  readonly email: string;
  readonly name: string;
  readonly roleId: UUID | null;
  readonly tenantId: UUID;
  readonly failedLoginAttempts: number;
  readonly lockedAt: ISODateString | null;
  readonly lockedUntil: ISODateString | null;
  readonly lastLoginAttempt: ISODateString | null;
}

/**
 * User with role information
 */
export interface UserWithRole extends User {
  readonly role: Role | null;
}

/**
 * User with full details including tenant
 */
export interface UserWithDetails extends UserWithRole {
  readonly tenant: Tenant;
}

/**
 * User from database (internal use only - includes password hash)
 */
export interface UserFromDatabase extends User {
  readonly password: string;
}

/**
 * Create user request data
 */
export interface CreateUserData {
  readonly email: string;
  readonly name: string;
  readonly password: string;
  readonly roleId?: UUID;
  readonly tenantId?: UUID;
}

/**
 * Update user request data
 */
export interface UpdateUserData {
  readonly email?: string;
  readonly name?: string;
  readonly password?: string;
  readonly roleId?: UUID;
}

/**
 * User login credentials
 */
export interface UserLoginCredentials {
  readonly email: string;
  readonly password: string;
}

/**
 * User JWT payload
 */
export interface UserJwtPayload {
  readonly id: UUID;
  readonly email: string;
  readonly tenantId: UUID;
  readonly role: string;
  readonly iat: number;
  readonly exp: number;
  readonly jti: string;
}

/**
 * Authentication token response
 */
export interface AuthTokenResponse {
  readonly token: string;
  readonly refreshToken?: string;
  readonly user: UserWithDetails;
  readonly expiresIn: number;
}

/**
 * User profile update data
 */
export interface UserProfileUpdateData {
  readonly name?: string;
  readonly email?: string;
}

/**
 * Password change data
 */
export interface PasswordChangeData {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

/**
 * User filter params
 */
export interface UserFilterParams {
  readonly search?: string;
  readonly roleId?: UUID;
  readonly tenantId?: UUID;
  readonly isLocked?: boolean;
  readonly createdAfter?: ISODateString;
  readonly createdBefore?: ISODateString;
}

/**
 * User list item (for tables and lists)
 */
export interface UserListItem extends User {
  readonly roleName: string | null;
  readonly tenantName: string;
  readonly isLocked: boolean;
  readonly lastLogin?: ISODateString;
}

/**
 * User unlock request
 */
export interface UserUnlockRequest {
  readonly userId: UUID;
  readonly reason?: string;
}

/**
 * User unlock response
 */
export interface UserUnlockResponse {
  readonly userId: UUID;
  readonly email: string;
  readonly name: string;
  readonly unlockedAt: ISODateString;
}

/**
 * User session info
 */
export interface UserSession {
  readonly userId: UUID;
  readonly sessionId: string;
  readonly createdAt: ISODateString;
  readonly expiresAt: ISODateString;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

/**
 * User activity log
 */
export interface UserActivity {
  readonly userId: UUID;
  readonly action: string;
  readonly resource: string;
  readonly timestamp: ISODateString;
  readonly details?: Record<string, unknown>;
}

/**
 * User validation result
 */
export interface UserValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly {
    readonly field: string;
    readonly message: string;
  }[];
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  readonly isValid: boolean;
  readonly message: string;
  readonly strength?: 'weak' | 'medium' | 'strong';
}
