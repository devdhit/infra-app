import { PrismaClient, Prisma } from '@prisma/client'
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse, 
  badRequestResponse 
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
      return errorResponse('Internal server error')
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
      return errorResponse('Internal server error')
    }
  }

  // Create a new asset
  async create(user: { id: string; tenantId: string }, body: T) {
    try {
      // Validate required fields
      if (this.operations.requiredFields) {
        for (const field of this.operations.requiredFields) {
          if (!body[field]) {
            return badRequestResponse(`${String(field)} is required`)
          }
        }
      }

      // Check if asset with unique field already exists
      if (this.operations.uniqueField && body[this.operations.uniqueField]) {
        const existingAsset = await (this.db as any)[this.operations.modelName].findUnique({
          where: { [this.operations.uniqueField]: body[this.operations.uniqueField] }
        })

        if (existingAsset) {
          return badRequestResponse(`${this.operations.modelName} with this ${String(this.operations.uniqueField)} already exists`)
        }
      }

      // Create history record
      const historyData = {
        action: 'create',
        modelType: this.operations.modelName,
        changes: body as any,
        userId: user.id,
        tenantId: user.tenantId
      }

      const asset = await (this.db as any)[this.operations.modelName].create({
        data: {
          ...body as any,
          tenantId: user.tenantId,
          histories: {
            create: historyData
          }
        },
        include: this.operations.include
      })

      return successResponse(asset, 201)
    } catch (error) {
      console.error(`Error creating ${this.operations.modelName} asset:`, error)
      return errorResponse('Internal server error')
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

      // Create history record for changes
      const changes: Record<string, { from: any; to: any }> = {}
      Object.keys(body).forEach(key => {
        if (body[key as keyof T] !== existingAsset[key as keyof typeof existingAsset]) {
          changes[key] = {
            from: existingAsset[key as keyof typeof existingAsset],
            to: body[key as keyof T]
          }
        }
      })

      if (Object.keys(changes).length > 0) {
        const historyData = {
          action: 'update',
          modelType: this.operations.modelName,
          recordId: id,
          changes,
          userId: user.id,
          tenantId: user.tenantId
        }

        await this.db.history.create({
          data: historyData
        })
      }

      const asset = await (this.db as any)[this.operations.modelName].update({
        where: { 
          id,
          tenantId: user.tenantId 
        },
        data: body as any,
        include: this.operations.include
      })

      return successResponse(asset)
    } catch (error: any) {
      if (error.code === 'P2025') {
        return notFoundResponse(`${this.operations.modelName} asset not found`)
      }
      
      console.error(`Error updating ${this.operations.modelName} asset:`, error)
      return errorResponse('Internal server error')
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
      const historyData = {
        action: 'delete',
        modelType: this.operations.modelName,
        recordId: id,
        changes: existingAsset,
        userId: user.id,
        tenantId: user.tenantId
      }

      await this.db.history.create({
        data: historyData
      })

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
      return errorResponse('Internal server error')
    }
  }
}