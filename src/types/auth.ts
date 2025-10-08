// Define authentication-related interfaces and types
import { Role } from './permissions';

// Define the structure for JWT payload
export interface UserJwtPayload {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

// Define the structure for a user
export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  tenantId: string;
  failedLoginAttempts: number;
  lockedAt?: string;
  lockedUntil?: string;
  lastLoginAttempt?: string;
  createdAt: string;
  updatedAt: string;
  role?: Role;
  tenant?: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Define the structure for login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Define the structure for registration data
export interface RegistrationData {
  email: string;
  name: string;
  password: string;
  tenantId: string;
  roleId: string;
}

// Define the structure for token response
export interface TokenResponse {
  token: string;
  refreshToken?: string;
  user: Omit<User, 'role' | 'tenant'> & {
    role: Omit<Role, 'permissions'> & {
      permissions: Record<string, string[]>;
    };
    tenant: {
      id: string;
      name: string;
      description: string;
      createdAt: string;
      updatedAt: string;
    } | null;
  };
}