import { PrismaClient, Prisma } from '@prisma/client'
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse, 
  badRequestResponse,
  conflictResponse,
  validationErrorResponse
} from './api-utils'

// Define the structure for asset operations
interface AssetOperations<T> {
  modelName: string
  requiredFields?: (keyof T)[]
  uniqueField?: keyof T
  searchFields?: (keyof T)[]
  include?: any
}

// Generic asset API handler
export class AssetApiHandler<T> {
  constructor(private db: PrismaClient, private operations: AssetOperations<T>) {}

  // Get all assets with pagination and filtering
  async getAll(
    user: { tenantId: string }, 
    queryParams: { page: number; limit: number; search: string; status: string }
  ) {
    try {
      const { page, limit, search, status } = queryParams

      const where: any = {
        tenantId: user.tenantId
      }

      // Add search filter
      if (search && this.operations.searchFields) {
        where.OR = this.operations.searchFields.map((field: any) => ({
          [field]: { contains: search, mode: 'insensitive' }
        }))
      }

      // Add status filter
      if (status) {
        where.status = status
      }

      const [assets, total] = await Promise.all([
        (this.db as any)[this.operations.modelName].findMany({
          where,
          include: this.operations.include,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        (this.db as any)[this.operations.modelName].count({ where })
      ])

      return successResponse({
        data: assets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error(`Error fetching ${this.operations.modelName} assets:`, error)
      return errorResponse('Failed to fetch assets. Please try again later.')
    }
  }

  // Get a specific asset by ID
  async getById(user: { tenantId: string }, id: string) {
    try {
      const asset = await (this.db as any)[this.operations.modelName].findUnique({
        where: { 
          id,
          tenantId: user.tenantId 
        },
        include: this.operations.include
      })

      if (!asset) {
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }

      return successResponse(asset)
    } catch (error) {
      console.error(`Error fetching ${this.operations.modelName} asset:`, error)
      return errorResponse('Failed to fetch asset details. Please try again later.')
    }
  }

  // Create a new asset
  async create(user: { id: string; tenantId: string }, body: T) {
    try {
      // Validate required fields
      const validationErrors: Record<string, string> = {}
      
      if (this.operations.requiredFields) {
        for (const field of this.operations.requiredFields) {
          if (body[field] === undefined || body[field] === null || body[field] === "") {
            validationErrors[String(field)] = `${String(field)} is required`
          }
        }
      }

      // Return validation errors if any
      if (Object.keys(validationErrors).length > 0) {
        return validationErrorResponse(validationErrors)
      }

      // Check if asset with unique field already exists
      if (this.operations.uniqueField && body[this.operations.uniqueField]) {
        const existingAsset = await (this.db as any)[this.operations.modelName].findUnique({
          where: { [this.operations.uniqueField]: body[this.operations.uniqueField] }
        })

        if (existingAsset) {
          return conflictResponse(`${this.operations.modelName} with this ${String(this.operations.uniqueField)} already exists`)
        }
      }

      // Filter out undefined values to prevent setting fields to undefined
      const createData = Object.keys(body || {}).reduce((acc, key) => {
        if (body[key as keyof T] !== undefined) {
          (acc as any)[key] = body[key as keyof T];
        }
        return acc;
      }, {} as Partial<T>);

      const asset = await (this.db as any)[this.operations.modelName].create({
        data: {
          ...createData as any,
          tenantId: user.tenantId
        },
        include: this.operations.include
      })

      // Create history record after asset creation
      try {
        await this.db.history.create({
          data: {
            action: 'create',
            modelType: this.operations.modelName,
            recordId: asset.id,
            changes: body as any,
            userId: user.id,
            tenantId: user.tenantId
          }
        })
      } catch (historyError) {
        console.error(`Failed to create history record for ${this.operations.modelName}:`, historyError)
        // Continue with the operation even if history creation fails
      }

      return successResponse(asset, 201)
    } catch (error: any) {
      console.error(`Error creating ${this.operations.modelName} asset:`, error)
      
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        return conflictResponse('An asset with this identifier already exists.')
      }
      
      return errorResponse('Failed to create asset. Please try again later.')
    }
  }

  // Update an existing asset
  async update(user: { id: string; tenantId: string }, id: string, body: Partial<T>) {
    try {
      // Check if asset exists and belongs to user's tenant
      const existingAsset = await (this.db as any)[this.operations.modelName].findUnique({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      })

      if (!existingAsset) {
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }

      // Validate required fields if they're being updated
      const validationErrors: Record<string, string> = {}
      
      if (this.operations.requiredFields) {
        for (const field of this.operations.requiredFields) {
          // Only validate if the field is being updated
          if (field in body && (body[field] === undefined || body[field] === null || body[field] === "")) {
            validationErrors[String(field)] = `${String(field)} is required`
          }
          // If field is not being updated, ensure it exists in the existing asset
          if (!(field in body) && (existingAsset[field as keyof typeof existingAsset] === undefined || existingAsset[field as keyof typeof existingAsset] === null || existingAsset[field as keyof typeof existingAsset] === "")) {
            validationErrors[String(field)] = `${String(field)} is required`
          }
        }
      }

      // Return validation errors if any
      if (Object.keys(validationErrors).length > 0) {
        return validationErrorResponse(validationErrors)
      }

      // Check if unique field is being updated and already exists for another asset
      if (this.operations.uniqueField && body[this.operations.uniqueField] && 
          body[this.operations.uniqueField] !== existingAsset[this.operations.uniqueField as keyof typeof existingAsset]) {
        const existingAssetWithUniqueField = await (this.db as any)[this.operations.modelName].findUnique({
          where: { 
            [this.operations.uniqueField]: body[this.operations.uniqueField],
            NOT: { id: id }
          }
        })

        if (existingAssetWithUniqueField) {
          return conflictResponse(`${this.operations.modelName} with this ${String(this.operations.uniqueField)} already exists`)
        }
      }

      // Create history record for changes
      const changes: Record<string, { from: any; to: any }> = {}
      Object.keys(body).forEach(key => {
        // Skip undefined values to avoid setting fields to undefined
        if (body[key as keyof T] !== undefined && 
            body[key as keyof T] !== existingAsset[key as keyof typeof existingAsset]) {
          changes[key] = {
            from: existingAsset[key as keyof typeof existingAsset],
            to: body[key as keyof T]
          }
        }
      })

      if (Object.keys(changes).length > 0) {
        try {
          await this.db.history.create({
            data: {
              action: 'update',
              modelType: this.operations.modelName,
              recordId: id,
              changes,
              userId: user.id,
              tenantId: user.tenantId
            }
          })
        } catch (historyError) {
          console.error(`Failed to create history record for ${this.operations.modelName}:`, historyError)
          // Continue with the operation even if history creation fails
        }
      }

      // Filter out undefined values to prevent setting fields to undefined
      const updateData = Object.keys(body || {}).reduce((acc, key) => {
        if (body[key as keyof T] !== undefined) {
          (acc as any)[key] = body[key as keyof T];
        }
        return acc;
      }, {} as Partial<T>);

      const asset = await (this.db as any)[this.operations.modelName].update({
        where: { 
          id,
          tenantId: user.tenantId 
        },
        data: updateData as any,
        include: this.operations.include
      })

      return successResponse(asset)
    } catch (error: any) {
      if (error.code === 'P2025') {
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }
      
      console.error(`Error updating ${this.operations.modelName} asset:`, error)
      
      // Handle Prisma-specific errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        return conflictResponse('An asset with this identifier already exists.')
      }
      
      return errorResponse('Failed to update asset. Please try again later.')
    }
  }

  // Delete an asset
  async delete(user: { id: string; tenantId: string }, id: string) {
    try {
      // Check if asset exists and belongs to user's tenant
      const existingAsset = await (this.db as any)[this.operations.modelName].findUnique({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      })

      if (!existingAsset) {
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }

      // Create history record
      try {
        await this.db.history.create({
          data: {
            action: 'delete',
            modelType: this.operations.modelName,
            recordId: id,
            changes: existingAsset,
            userId: user.id,
            tenantId: user.tenantId
          }
        })
      } catch (historyError) {
        console.error(`Failed to create history record for ${this.operations.modelName}:`, historyError)
        // Continue with the operation even if history creation fails
      }

      await (this.db as any)[this.operations.modelName].delete({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      })

      return successResponse<null>(null, 204)
    } catch (error: any) {
      if (error.code === 'P2025') {
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }
      
      console.error(`Error deleting ${this.operations.modelName} asset:`, error)
      return errorResponse('Failed to delete asset. Please try again later.')
    }
  }

  // Bulk delete assets
  async bulkDelete(user: { id: string; tenantId: string }, ids: string[]) {
    try {
      // Validate input
      if (!ids || ids.length === 0) {
        return badRequestResponse('No asset IDs provided')
      }

      // Check if all assets exist and belong to user's tenant
      const existingAssets = await (this.db as any)[this.operations.modelName].findMany({
        where: { 
          id: { in: ids },
          tenantId: user.tenantId 
        }
      })

      // Check if all requested assets were found
      const foundIds = existingAssets.map((asset: any) => asset.id)
      const missingIds = ids.filter(id => !foundIds.includes(id))
      
      if (missingIds.length > 0) {
        return notFoundResponse(`Some ${this.operations.modelName} assets not found: ${missingIds.join(', ')}`)
      }

      // Create history records for each asset
      for (const asset of existingAssets) {
        try {
          await this.db.history.create({
            data: {
              action: 'delete',
              modelType: this.operations.modelName,
              recordId: asset.id,
              changes: asset,
              userId: user.id,
              tenantId: user.tenantId
            }
          })
        } catch (historyError) {
          console.error(`Failed to create history record for asset ${asset.id}:`, historyError)
          // Continue with deletion even if history creation fails
        }
      }

      // Delete all assets
      const deleteResult = await (this.db as any)[this.operations.modelName].deleteMany({
        where: { 
          id: { in: ids },
          tenantId: user.tenantId 
        }
      })

      // Log the number of deleted assets
      console.log(`Deleted ${deleteResult.count} ${this.operations.modelName} assets`)

      return successResponse<null>(null, 204)
    } catch (error: any) {
      console.error(`Error bulk deleting ${this.operations.modelName} assets:`, error)
      
      // Handle Prisma-specific errors
      if (error.code === 'P2025') {
        return notFoundResponse(`${this.operations.modelName} assets not found`)
      }
      
      return errorResponse('Failed to delete assets. Please try again later.')
    }
  }
}