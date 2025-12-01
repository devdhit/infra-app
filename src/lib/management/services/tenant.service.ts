/**
 * Tenant service - Business logic layer
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { tenantRepository } from '../repositories';
import { validate, createTenantSchema, updateTenantSchema } from '../validation';
import type {
  Tenant,
  TenantWithDetails,
  CreateTenantData,
  UpdateTenantData,
  TenantFilterParams,
  UUID,
  Result,
} from '@/types/management';
import logger from '@/lib/logger';

export class TenantService {
  /**
   * Get tenant by ID
   */
  async getTenantById(id: UUID): Promise<Result<Tenant, Error>> {
    try {
      const tenant = await tenantRepository.findByIdWithCounts(id);
      
      if (!tenant) {
        return {
          success: false,
          error: new Error(`Tenant with ID ${id} not found`),
        };
      }

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      logger.error('Error getting tenant by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get tenant'),
      };
    }
  }

  /**
   * Get tenant with full details
   */
  async getTenantWithDetails(id: UUID): Promise<Result<TenantWithDetails, Error>> {
    try {
      const tenant = await tenantRepository.findByIdWithDetails(id);
      
      if (!tenant) {
        return {
          success: false,
          error: new Error(`Tenant with ID ${id} not found`),
        };
      }

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      logger.error('Error getting tenant with details:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get tenant details'),
      };
    }
  }

  /**
   * Get all tenants
   */
  async getAllTenants(): Promise<Result<readonly Tenant[], Error>> {
    try {
      const tenants = await tenantRepository.findAllWithCounts();

      return {
        success: true,
        data: tenants,
      };
    } catch (error) {
      logger.error('Error getting all tenants:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get tenants'),
      };
    }
  }

  /**
   * Search tenants by filter
   */
  async searchTenants(filter: TenantFilterParams): Promise<Result<readonly Tenant[], Error>> {
    try {
      const tenants = await tenantRepository.findByFilter(filter);

      return {
        success: true,
        data: tenants,
      };
    } catch (error) {
      logger.error('Error searching tenants:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to search tenants'),
      };
    }
  }

  /**
   * Create new tenant
   */
  async createTenant(data: CreateTenantData): Promise<Result<Tenant, Error>> {
    try {
      // Validate input
      const validationResult = validate(createTenantSchema, data);
      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: new Error(validationResult.errors?.map(e => e.message).join(', ') || 'Validation failed'),
        };
      }

      // Create tenant
      const tenant = await tenantRepository.createTenant(validationResult.data);

      logger.info('Tenant created successfully:', { tenantId: tenant.id });

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      logger.error('Error creating tenant:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to create tenant'),
      };
    }
  }

  /**
   * Update tenant
   */
  async updateTenant(id: UUID, data: UpdateTenantData): Promise<Result<Tenant, Error>> {
    try {
      // Check if tenant exists
      const exists = await tenantRepository.exists(id);
      if (!exists) {
        return {
          success: false,
          error: new Error(`Tenant with ID ${id} not found`),
        };
      }

      // Validate input
      const validationResult = validate(updateTenantSchema, data);
      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: new Error(validationResult.errors?.map(e => e.message).join(', ') || 'Validation failed'),
        };
      }

      // Update tenant
      const tenant = await tenantRepository.updateTenant(id, validationResult.data);

      logger.info('Tenant updated successfully:', { tenantId: id });

      return {
        success: true,
        data: tenant,
      };
    } catch (error) {
      logger.error('Error updating tenant:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to update tenant'),
      };
    }
  }

  /**
   * Delete tenant
   */
  async deleteTenant(id: UUID): Promise<Result<void, Error>> {
    try {
      // Check if tenant exists
      const exists = await tenantRepository.exists(id);
      if (!exists) {
        return {
          success: false,
          error: new Error(`Tenant with ID ${id} not found`),
        };
      }

      // Check if tenant has users
      const hasUsers = await tenantRepository.hasUsers(id);
      if (hasUsers) {
        return {
          success: false,
          error: new Error('Cannot delete tenant with existing users'),
        };
      }

      // Check if tenant has assets
      const hasAssets = await tenantRepository.hasAssets(id);
      if (hasAssets) {
        return {
          success: false,
          error: new Error('Cannot delete tenant with existing assets'),
        };
      }

      // Delete tenant
      await tenantRepository.delete(id);

      logger.info('Tenant deleted successfully:', { tenantId: id });

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      logger.error('Error deleting tenant:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to delete tenant'),
      };
    }
  }

  /**
   * Bulk delete tenants
   */
  async bulkDeleteTenants(ids: readonly UUID[]): Promise<Result<number, Error>> {
    try {
      // Validate each tenant can be deleted
      for (const id of ids) {
        const hasUsers = await tenantRepository.hasUsers(id);
        if (hasUsers) {
          return {
            success: false,
            error: new Error(`Cannot delete tenant ${id} with existing users`),
          };
        }

        const hasAssets = await tenantRepository.hasAssets(id);
        if (hasAssets) {
          return {
            success: false,
            error: new Error(`Cannot delete tenant ${id} with existing assets`),
          };
        }
      }

      // Delete all tenants
      const deletedCount = await tenantRepository.bulkDelete(ids);

      logger.info('Tenants bulk deleted successfully:', { count: deletedCount });

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error) {
      logger.error('Error bulk deleting tenants:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to bulk delete tenants'),
      };
    }
  }
}

// Singleton instance
export const tenantService = new TenantService();
