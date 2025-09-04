"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHistoryRecord = createHistoryRecord;
exports.getHistoryForRecord = getHistoryForRecord;
exports.getTenantHistory = getTenantHistory;
const db_1 = require("@/lib/db");
/**
 * Creates a history record for tracking changes to entities
 * @param record - The history record to create
 * @returns The created history record
 */
async function createHistoryRecord(record) {
    try {
        const historyRecord = await db_1.db.history.create({
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
    }
    catch (error) {
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
async function getHistoryForRecord(modelType, recordId, tenantId) {
    try {
        const historyRecords = await db_1.db.history.findMany({
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
    }
    catch (error) {
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
async function getTenantHistory(tenantId, modelType, limit) {
    try {
        const historyRecords = await db_1.db.history.findMany({
            where: Object.assign({ tenantId }, (modelType && { modelType })),
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
    }
    catch (error) {
        console.error('Error fetching tenant history:', error);
        throw error;
    }
}
