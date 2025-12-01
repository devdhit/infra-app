/**
 * User service - Business logic layer
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { userRepository } from '../repositories';
import { validate, createUserSchema, updateUserSchema, passwordChangeSchema } from '../validation';
import { hashPassword, verifyPassword } from '@/lib/auth';
import type {
  UserWithRole,
  UserWithDetails,
  CreateUserData,
  UpdateUserData,
  PasswordChangeData,
  UserFilterParams,
  UUID,
  Result,
} from '@/types/management';
import logger from '@/lib/logger';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(id: UUID): Promise<Result<UserWithRole, Error>> {
    try {
      const user = await userRepository.findByIdWithRole(id);
      
      if (!user) {
        return {
          success: false,
          error: new Error(`User with ID ${id} not found`),
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get user'),
      };
    }
  }

  /**
   * Get user with full details
   */
  async getUserWithDetails(id: UUID): Promise<Result<UserWithDetails, Error>> {
    try {
      const user = await userRepository.findByIdWithDetails(id);
      
      if (!user) {
        return {
          success: false,
          error: new Error(`User with ID ${id} not found`),
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      logger.error('Error getting user with details:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get user details'),
      };
    }
  }

  /**
   * Get users by tenant
   */
  async getTenantUsers(tenantId: UUID): Promise<Result<readonly UserWithRole[], Error>> {
    try {
      const users = await userRepository.findByTenant(tenantId);

      return {
        success: true,
        data: users,
      };
    } catch (error) {
      logger.error('Error getting tenant users:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get users'),
      };
    }
  }

  /**
   * Search users by filter
   */
  async searchUsers(filter: UserFilterParams): Promise<Result<readonly UserWithRole[], Error>> {
    try {
      const users = await userRepository.findByFilter(filter);

      return {
        success: true,
        data: users,
      };
    } catch (error) {
      logger.error('Error searching users:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to search users'),
      };
    }
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserData, tenantId: UUID): Promise<Result<UserWithRole, Error>> {
    try {
      // Validate input
      const validationResult = validate(createUserSchema, data);
      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: new Error(validationResult.errors?.map(e => e.message).join(', ') || 'Validation failed'),
        };
      }

      // Check if email already exists
      const emailExists = await userRepository.emailExists(validationResult.data.email);
      if (emailExists) {
        return {
          success: false,
          error: new Error(`User with email "${validationResult.data.email}" already exists`),
        };
      }

      // Hash password
      const hashedPassword = await hashPassword(validationResult.data.password);

      // Create user
      const user = await userRepository.createUser({
        email: validationResult.data.email,
        name: validationResult.data.name,
        password: hashedPassword,
        roleId: validationResult.data.roleId,
        tenantId: validationResult.data.tenantId || tenantId,
      });

      logger.info('User created successfully:', { userId: user.id, email: user.email });

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      logger.error('Error creating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to create user'),
      };
    }
  }

  /**
   * Update user
   */
  async updateUser(id: UUID, data: UpdateUserData): Promise<Result<UserWithRole, Error>> {
    try {
      // Check if user exists
      const exists = await userRepository.exists(id);
      if (!exists) {
        return {
          success: false,
          error: new Error(`User with ID ${id} not found`),
        };
      }

      // Validate input
      const validationResult = validate(updateUserSchema, data);
      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: new Error(validationResult.errors?.map(e => e.message).join(', ') || 'Validation failed'),
        };
      }

      // Check if new email conflicts
      if (validationResult.data.email) {
        const emailExists = await userRepository.emailExists(validationResult.data.email, id);
        if (emailExists) {
          return {
            success: false,
            error: new Error(`User with email "${validationResult.data.email}" already exists`),
          };
        }
      }

      // Hash password if provided
      const updateData = { ...validationResult.data };
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }

      // Update user
      const user = await userRepository.updateUser(id, updateData);

      logger.info('User updated successfully:', { userId: id });

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      logger.error('Error updating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to update user'),
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: UUID,
    data: PasswordChangeData
  ): Promise<Result<void, Error>> {
    try {
      // Validate input
      const validationResult = validate(passwordChangeSchema, data);
      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: new Error(validationResult.errors?.map(e => e.message).join(', ') || 'Validation failed'),
        };
      }

      // Get user with password
      const userFromDb = await userRepository.findByEmail(
        (await userRepository.findById(userId))?.email || ''
      );

      if (!userFromDb) {
        return {
          success: false,
          error: new Error('User not found'),
        };
      }

      // Verify current password
      const isValidPassword = await verifyPassword(
        validationResult.data.currentPassword,
        userFromDb.password,
        'system'
      );

      if (!isValidPassword) {
        return {
          success: false,
          error: new Error('Current password is incorrect'),
        };
      }

      // Hash new password
      const hashedPassword = await hashPassword(validationResult.data.newPassword);

      // Update password
      await userRepository.updatePassword(userId, hashedPassword);

      logger.info('Password changed successfully:', { userId });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      logger.error('Error changing password:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to change password'),
      };
    }
  }

  /**
   * Lock user account
   */
  async lockUser(id: UUID): Promise<Result<void, Error>> {
    try {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_DURATION_MINUTES);

      await userRepository.lockUser(id, lockUntil);

      logger.info('User locked successfully:', { userId: id, lockUntil });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      logger.error('Error locking user:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to lock user'),
      };
    }
  }

  /**
   * Unlock user account
   */
  async unlockUser(id: UUID): Promise<Result<void, Error>> {
    try {
      await userRepository.unlockUser(id);

      logger.info('User unlocked successfully:', { userId: id });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      logger.error('Error unlocking user:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to unlock user'),
      };
    }
  }

  /**
   * Handle failed login attempt
   */
  async handleFailedLogin(userId: UUID): Promise<Result<boolean, Error>> {
    try {
      // Get user with role to check if it's an agent
      const userResult = await this.getUserById(userId);
      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: new Error('User not found'),
        };
      }

      const user = userResult.data;
      const isAgentUser = user.role?.name === 'agent';

      const attempts = await userRepository.incrementFailedAttempts(userId);

      // Only lock user if they are not an agent
      // Agents send information requests every 6 hours and should not be locked
      if (!isAgentUser && attempts >= MAX_FAILED_ATTEMPTS) {
        await this.lockUser(userId);
        return {
          success: true,
          data: true, // User is now locked
        };
      }

      return {
        success: true,
        data: false, // User is not locked
      };
    } catch (error) {
      logger.error('Error handling failed login:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to handle failed login'),
      };
    }
  }

  /**
   * Handle successful login
   */
  async handleSuccessfulLogin(userId: UUID): Promise<Result<void, Error>> {
    try {
      await userRepository.resetFailedAttempts(userId);

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      logger.error('Error handling successful login:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to handle successful login'),
      };
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: UUID): Promise<Result<void, Error>> {
    try {
      const exists = await userRepository.exists(id);
      if (!exists) {
        return {
          success: false,
          error: new Error(`User with ID ${id} not found`),
        };
      }

      await userRepository.delete(id);

      logger.info('User deleted successfully:', { userId: id });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      logger.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to delete user'),
      };
    }
  }

  /**
   * Bulk delete users
   */
  async bulkDeleteUsers(ids: readonly UUID[]): Promise<Result<number, Error>> {
    try {
      const deletedCount = await userRepository.bulkDelete(ids);

      logger.info('Users bulk deleted successfully:', { count: deletedCount });

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error) {
      logger.error('Error bulk deleting users:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to bulk delete users'),
      };
    }
  }
}

// Singleton instance
export const userService = new UserService();
