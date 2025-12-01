/**
 * Base repository for common database operations
 * Following strict TypeScript best practices - NO 'any' type allowed
 */

import { db } from '@/lib/db';
import type { UUID, BaseEntity, PaginationParams, PaginatedResponse } from '@/types/management';

/**
 * Base repository interface
 */
export interface IBaseRepository<T extends BaseEntity> {
  findById(id: UUID): Promise<T | null>;
  findMany(params?: PaginationParams): Promise<readonly T[]>;
  create(data: Omit<T, keyof BaseEntity>): Promise<T>;
  update(id: UUID, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T>;
  delete(id: UUID): Promise<void>;
  count(filter?: Record<string, unknown>): Promise<number>;
}

/**
 * Base repository abstract class
 */
export abstract class BaseRepository<T extends BaseEntity> implements IBaseRepository<T> {
  protected abstract readonly modelName: string;

  /**
   * Get Prisma model delegate
   */
  protected get model() {
    const modelDelegate = (db as unknown as Record<string, unknown>)[this.modelName];
    if (!modelDelegate) {
      throw new Error(`Model ${this.modelName} not found in Prisma client`);
    }
    return modelDelegate as PrismaModelDelegate<T>;
  }

  /**
   * Find entity by ID
   */
  async findById(id: UUID): Promise<T | null> {
    const result = await (this.model.findUnique as FindUniqueFn<T>)({
      where: { id },
    });
    return result;
  }

  /**
   * Find multiple entities
   */
  async findMany(params?: PaginationParams): Promise<readonly T[]> {
    const { page = 1, limit = 10, search } = params || {};
    const skip = (page - 1) * limit;

    const where = search ? this.buildSearchWhere(search) : {};

    const results = await (this.model.findMany as FindManyFn<T>)({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return results;
  }

  /**
   * Find with pagination
   */
  async findManyPaginated(params?: PaginationParams): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10, search } = params || {};
    const skip = (page - 1) * limit;

    const where = search ? this.buildSearchWhere(search) : {};

    const [data, total] = await Promise.all([
      (this.model.findMany as FindManyFn<T>)({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.model.count as CountFn)({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create new entity
   */
  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    const result = await (this.model.create as CreateFn<T>)({
      data: data as CreateInput<T>,
    });
    return result;
  }

  /**
   * Update entity
   */
  async update(id: UUID, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T> {
    const result = await (this.model.update as UpdateFn<T>)({
      where: { id },
      data: data as UpdateInput<T>,
    });
    return result;
  }

  /**
   * Delete entity
   */
  async delete(id: UUID): Promise<void> {
    await (this.model.delete as DeleteFn)({
      where: { id },
    });
  }

  /**
   * Count entities
   */
  async count(filter?: Record<string, unknown>): Promise<number> {
    return (this.model.count as CountFn)({
      where: filter,
    });
  }

  /**
   * Check if entity exists
   */
  async exists(id: UUID): Promise<boolean> {
    const result = await (this.model.findUnique as FindUniqueFn<T>)({
      where: { id },
      select: { id: true },
    });
    return result !== null;
  }

  /**
   * Bulk delete entities
   */
  async bulkDelete(ids: readonly UUID[]): Promise<number> {
    const result = await (this.model.deleteMany as DeleteManyFn)({
      where: { id: { in: [...ids] } },
    });
    return result.count;
  }

  /**
   * Build search where clause (to be overridden by subclasses)
   */
  protected buildSearchWhere(_search: string): Record<string, unknown> {
    return {};
  }
}

/**
 * Prisma model delegate type helpers
 */
type PrismaModelDelegate<T> = {
  findUnique: FindUniqueFn<T>;
  findMany: FindManyFn<T>;
  create: CreateFn<T>;
  update: UpdateFn<T>;
  delete: DeleteFn;
  deleteMany: DeleteManyFn;
  count: CountFn;
};

type FindUniqueFn<T> = (args: { where: { id: string }; select?: Record<string, boolean> }) => Promise<T | null>;
type FindManyFn<T> = (args: {
  where?: Record<string, unknown>;
  skip?: number;
  take?: number;
  orderBy?: Record<string, string>;
  include?: Record<string, boolean>;
}) => Promise<readonly T[]>;
type CreateFn<T> = (args: { data: CreateInput<T> }) => Promise<T>;
type UpdateFn<T> = (args: { where: { id: string }; data: UpdateInput<T> }) => Promise<T>;
type DeleteFn = (args: { where: { id: string } }) => Promise<unknown>;
type DeleteManyFn = (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
type CountFn = (args?: { where?: Record<string, unknown> }) => Promise<number>;

type CreateInput<T> = Omit<T, keyof BaseEntity>;
type UpdateInput<T> = Partial<Omit<T, keyof BaseEntity>>;
