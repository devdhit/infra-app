/**
 * Role service - Business logic layer
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { roleRepository } from '../repositories';
import { validate, createRoleSchema, updateRoleSchema } from '../validation';
import { invalidateRoleCache, invalidateTenantRoleCache } from '@/lib/permissions';
import type {
  Role,
  RoleWithUsers,
  CreateRoleData,
  UpdateRoleData,
  UUID,
  Result,
} from '@/types/management';
import logger from '@/lib/logger';

export class RoleService {
  /**
   * Get role by ID
   */
  async getRoleById(id: UUID): Promise<Result<Role, Error>> {
    try {
      const role = await roleRepository.findById(id);
      
      if (!role) {
        return {
          success: false,
          error: new Error(`Role with ID ${id} not found`),
        };
      }

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      logger.error('Error getting role by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get role'),
      };
    }
  }

  /**
   * Get role with users
   */
  async getRoleWithUsers(id: UUID): Promise<Result<RoleWithUsers, Error>> {
    try {
      const role = await roleRepository.findByIdWithUsers(id);
      
      if (!role) {
        return {
          success: false,
          error: new Error(`Role with ID ${id} not found`),
        };
      }

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      logger.error('Error getting role with users:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get role details'),
      };
    }
  }

  /**
   * Get all roles for a tenant
   */
  async getTenantRoles(tenantId: UUID): Promise<Result<readonly Role[], Error>> {
    try {
      const roles = await roleRepository.findByTenant(tenantId);

      return {
        success: true,
        data: roles,
      };
    } catch (error) {
      logger.error('Error getting tenant roles:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get roles'),
      };
    }
  }

  /**
   * Create new role
   */
  async createRole(data: CreateRoleData, tenantId: UUID): Promise<Result<Role, Error>> {
    try {
      // Validate input
      const validationResult = validate(createRoleSchema, data);
      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: new Error(validationResult.errors?.map(e => e.message).join(', ') || 'Validation failed'),
        };
      }

      // Check if role name already exists for this tenant
      const nameExists = await roleRepository.nameExistsForTenant(
        validationResult.data.name,
        tenantId
      );

      if (nameExists) {
        return {
          success: false,
          error: new Error(`Role with name "${validationResult.data.name}" already exists`),
        };
      }

      // Create role
      const role = await roleRepository.createRole(validationResult.data, tenantId);

      // Invalidate cache
      await invalidateTenantRoleCache(tenantId);

      logger.info('Role created successfully:', { roleId: role.id, tenantId });

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      logger.error('Error creating role:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to create role'),
      };
    }
  }

  /**
   * Update role
   */
  async updateRole(id: UUID, data: UpdateRoleData): Promise<Result<Role, Error>> {
    try {
      // Get existing role
      const existingRole = await roleRepository.findById(id);
      if (!existingRole) {
        return {
          success: false,
          error: new Error(`Role with ID ${id} not found`),
        };
      }

      // Validate input
      const validationResult = validate(updateRoleSchema, data);
      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: new Error(validationResult.errors?.map(e => e.message).join(', ') || 'Validation failed'),
        };
      }

      // Check if new name conflicts with existing role
      if (validationResult.data.name) {
        const nameExists = await roleRepository.nameExistsForTenant(
          validationResult.data.name,
          existingRole.tenantId,
          id
        );

        if (nameExists) {
          return {
            success: false,
            error: new Error(`Role with name "${validationResult.data.name}" already exists`),
          };
        }
      }

      // Update role
      const role = await roleRepository.updateRole(id, validationResult.data);

      // Invalidate cache
      await invalidateRoleCache(id, role.tenantId);
      await invalidateTenantRoleCache(role.tenantId);

      logger.info('Role updated successfully:', { roleId: id });

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      logger.error('Error updating role:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to update role'),
      };
    }
  }

  /**
   * Delete role
   */
  async deleteRole(id: UUID): Promise<Result<void, Error>> {
    try {
      // Get role
      const role = await roleRepository.findById(id);
      if (!role) {
        return {
          success: false,
          error: new Error(`Role with ID ${id} not found`),
        };
      }

      // Check if role has users
      const hasUsers = await roleRepository.hasUsers(id);
      if (hasUsers) {
        return {
          success: false,
          error: new Error('Cannot delete role with assigned users'),
        };
      }

      // Prevent deletion of system roles
      if (role.name === 'admin' || role.name === 'user') {
        return {
          success: false,
          error: new Error('Cannot delete system roles'),
        };
      }

      // Delete role
      await roleRepository.delete(id);

      // Invalidate cache
      await invalidateRoleCache(id, role.tenantId);
      await invalidateTenantRoleCache(role.tenantId);

      logger.info('Role deleted successfully:', { roleId: id });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      logger.error('Error deleting role:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to delete role'),
      };
    }
  }

  /**
   * Bulk delete roles
   */
  async bulkDeleteRoles(ids: readonly UUID[]): Promise<Result<number, Error>> {
    try {
      // Validate each role can be deleted
      for (const id of ids) {
        const role = await roleRepository.findById(id);
        if (!role) {
          continue; // Skip non-existent roles
        }

        // Check if role is a system role
        if (role.name === 'admin' || role.name === 'user') {
          return {
            success: false,
            error: new Error(`Cannot delete system role: ${role.name}`),
          };
        }

        // Check if role has users
        const hasUsers = await roleRepository.hasUsers(id);
        if (hasUsers) {
          return {
            success: false,
            error: new Error(`Cannot delete role ${role.name} with assigned users`),
          };
        }
      }

      // Get tenant IDs for cache invalidation
      const tenantIds = new Set<UUID>();
      for (const id of ids) {
        const role = await roleRepository.findById(id);
        if (role) {
          tenantIds.add(role.tenantId);
        }
      }

      // Delete all roles
      const deletedCount = await roleRepository.bulkDelete(ids);

      // Invalidate cache for all affected tenants
      for (const tenantId of tenantIds) {
        await invalidateTenantRoleCache(tenantId);
      }

      logger.info('Roles bulk deleted successfully:', { count: deletedCount });

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error) {
      logger.error('Error bulk deleting roles:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to bulk delete roles'),
      };
    }
  }
}

// Singleton instance
export const roleService = new RoleService();
