// User-related type definitions

export interface UserJwtPayload {
  id: string
  email: string
  tenantId: string
  role: string
  iat: number
  exp: number
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Record<string, string[]>
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  name: string
  roleId?: string
  tenantId: string
  failedLoginAttempts?: number
  lockedAt?: string
  lockedUntil?: string
  lastLoginAttempt?: string
  createdAt: string
  updatedAt: string
  role?: Role
}

export interface UserCreateUpdate {
  id?: string
  email: string
  name: string
  password?: string
  roleId?: string
  tenantId?: string
}

export interface UnlockUserResponse {
  message: string
  user: {
    id: string
    email: string
    name: string
  }
}

// Props for UsersTable component
export interface UsersTableProps {
  users: User[]
  tenants: Array<{ id: string; name: string }>
  onEdit?: (user: User) => void
  onDelete?: (id: string | string[]) => void
  isDeleting: boolean
  deletingUserId: string | null
}