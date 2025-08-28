import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface HistoryRecord {
  action: string;
  modelType: string;
  recordId: string;
  changes: any;
  userId?: string;
  tenantId: string;
}

/**
 * Creates a history record for tracking changes to entities
 * @param record - The history record to create
 * @returns The created history record
 */
export async function createHistoryRecord(record: HistoryRecord) {
  try {
    const historyRecord = await db.history.create({
      data: {
        action: record.action,
        modelType: record.modelType,
        recordId: record.recordId,
        changes: record.changes,
        userId: record.userId,
        tenantId: record.tenantId,
      },
    });
    
    return historyRecord;
  } catch (error) {
    console.error('Error creating history record:', error);
    throw error;
  }
}

/**
 * Gets history records for a specific entity
 * @param modelType - The type of model (e.g., 'User', 'Tenant')
 * @param recordId - The ID of the record
 * @param tenantId - The tenant ID for filtering
 * @returns Array of history records
 */
export async function getHistoryForRecord(modelType: string, recordId: string, tenantId: string) {
  try {
    const historyRecords = await db.history.findMany({
      where: {
        modelType,
        recordId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    
    return historyRecords;
  } catch (error) {
    console.error('Error fetching history records:', error);
    throw error;
  }
}

/**
 * Gets history records for a tenant with optional filtering
 * @param tenantId - The tenant ID
 * @param modelType - Optional model type filter
 * @param limit - Optional limit for number of records
 * @returns Array of history records
 */
export async function getTenantHistory(tenantId: string, modelType?: string, limit?: number) {
  try {
    const historyRecords = await db.history.findMany({
      where: {
        tenantId,
        ...(modelType && { modelType }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    
    return historyRecords;
  } catch (error) {
    console.error('Error fetching tenant history:', error);
    throw error;
  }
}