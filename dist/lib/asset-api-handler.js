"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warehouseHandler = exports.licenseHandler = exports.printerHandler = exports.laptopHandler = exports.pcHandler = exports.AssetApiHandler = void 0;
const api_utils_1 = require("./api-utils");
const db_1 = require("@/lib/db");
const realtime_1 = require("@/lib/realtime");
// Generic asset API handler
class AssetApiHandler {
    constructor(db, operations) {
        this.db = db;
        this.operations = operations;
    }
    // Helper method to get optimized select fields based on asset type
    getSelectFieldsForAssetType() {
        // Base fields vary by model type as not all models have the same fields
        const getBaseFieldsForModel = (modelName) => {
            // Default base fields for all models
            const defaultBaseFields = {
                dept: true,
            };
            // Add status field for models that have it
            if (modelName === 'PC' || modelName === 'Laptop' || modelName === 'WarehouseIT') {
                return Object.assign(Object.assign({}, defaultBaseFields), { status: true, userName: modelName !== 'WarehouseIT' ? true : undefined });
            }
            else if (modelName === 'License') {
                return Object.assign(Object.assign({}, defaultBaseFields), { updateStatus: true, userName: true });
            }
            // Printer doesn't have status or userName fields
            return defaultBaseFields;
        };
        // Special handling for WarehouseIT which doesn't have dept field
        if (this.operations.modelName === 'WarehouseIT') {
            const baseFields = {
                status: true,
            };
            return Object.assign(Object.assign({}, baseFields), { cpuBarcode: true, cpuSapBarcode: true, monitorBarcode: true, monitorSapBarcode: true, upsBarcode: true, upsSapBarcode: true, note: true, customFields: true // Include custom fields
             });
        }
        const baseFields = getBaseFieldsForModel(this.operations.modelName);
        // Remove undefined fields from baseFields to prevent Prisma errors
        const cleanBaseFields = Object.fromEntries(Object.entries(baseFields).filter(([_, value]) => value !== undefined));
        switch (this.operations.modelName) {
            case 'PC':
                return Object.assign(Object.assign({}, cleanBaseFields), { cpuBarcode: true, cpuSapBarcode: true, monitorBarcode: true, monitorSapBarcode: true, upsBarcode: true, upsSapBarcode: true, pcName: true, userName: true, note: true, customFields: true // Include custom fields
                 });
            case 'Laptop':
                return Object.assign(Object.assign({}, cleanBaseFields), { barcode: true, sapBarcode: true, model: true, dateBuy: true, userName: true, email: true, customFields: true // Include custom fields
                 });
            case 'Printer':
                return Object.assign(Object.assign({}, cleanBaseFields), { barcode: true, model: true, location: true, color: true, ip: true, sapCode: true, date: true, note: true, customFields: true // Include custom fields
                 });
            case 'License':
                return Object.assign(Object.assign({}, cleanBaseFields), { deviceName: true, productType: true, productKey: true, model: true, pc: true, mac: true, ip: true, date: true, updateStatus: true, customFields: true // Include custom fields
                 });
            case 'WarehouseIT':
                return Object.assign(Object.assign({}, cleanBaseFields), { cpuBarcode: true, cpuSapBarcode: true, monitorBarcode: true, monitorSapBarcode: true, upsBarcode: true, upsSapBarcode: true, note: true, customFields: true // Include custom fields
                 });
            default:
                return Object.assign(Object.assign({}, cleanBaseFields), { customFields: true // Include custom fields by default
                 });
        }
    }
    // Get all assets with pagination and filtering
    async getAll(user, queryParams) {
        try {
            const { page, limit, search, status } = queryParams;
            const where = {
                tenantId: user.tenantId
            };
            // Add search filter with optimized indexing
            if (search && this.operations.searchFields) {
                // Get indexed fields appropriate for this model
                const modelAppropriateSearchFields = (field) => {
                    // Handle model-specific field availability
                    if (this.operations.modelName === 'Printer' && field === 'status') {
                        return false;
                    }
                    // Handle License model which uses updateStatus instead of status
                    if (this.operations.modelName === 'License' && field === 'status') {
                        return false;
                    }
                    // Map of indexed fields by model
                    const indexedFieldsByModel = {
                        'PC': ['userName', 'dept', 'status', 'cpuBarcode'],
                        'Laptop': ['userName', 'dept', 'status', 'barcode'],
                        'Printer': ['dept', 'barcode'],
                        'License': ['userName', 'dept', 'updateStatus', 'productKey'],
                        'WarehouseIT': ['status', 'cpuBarcode'] // Removed 'dept' as WarehouseIT doesn't have this field
                    };
                    // Get indexed fields for this model
                    const modelIndexedFields = indexedFieldsByModel[this.operations.modelName] || ['status']; // Changed default to 'status'
                    return modelIndexedFields.includes(field);
                };
                // Use indexed fields for better performance
                const indexedSearchFields = this.operations.searchFields.filter(modelAppropriateSearchFields);
                if (indexedSearchFields.length > 0) {
                    where.OR = indexedSearchFields.map((field) => ({
                        [field]: { contains: search, mode: 'insensitive' }
                    }));
                }
                else {
                    // Fallback to original search if no indexed fields
                    where.OR = this.operations.searchFields.map((field) => ({
                        [field]: { contains: search, mode: 'insensitive' }
                    }));
                }
            }
            // Add status filter based on model-specific status fields
            if (status) {
                if (this.operations.modelName === 'License') {
                    where.updateStatus = status; // License uses updateStatus instead of status
                }
                else if (this.operations.modelName !== 'Printer') {
                    where.status = status; // Other models use status (except Printer which has no status)
                }
            }
            // Optimize query by only selecting necessary fields
            const selectFields = Object.assign({ id: true, createdAt: true, updatedAt: true }, this.getSelectFieldsForAssetType());
            const [assets, total] = await Promise.all([
                this.db[this.operations.modelName].findMany({
                    where,
                    select: selectFields,
                    skip: (page - 1) * limit,
                    take: Math.min(limit, 100), // Limit maximum page size
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                this.db[this.operations.modelName].count({ where })
            ]);
            return (0, api_utils_1.successResponse)({
                data: assets,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            console.error(`Error fetching ${this.operations.modelName} assets:`, error);
            return (0, api_utils_1.errorResponse)('Failed to fetch assets. Please try again later.');
        }
    }
    // Get a specific asset by ID
    async getById(user, id) {
        try {
            // Get select fields for this asset type
            const selectFields = Object.assign({ id: true, createdAt: true, updatedAt: true, tenantId: true }, this.getSelectFieldsForAssetType());
            const asset = await this.db[this.operations.modelName].findUnique({
                where: {
                    id,
                    tenantId: user.tenantId
                },
                select: selectFields
            });
            if (!asset) {
                return (0, api_utils_1.notFoundResponse)(`${this.operations.modelName} asset not found`);
            }
            return (0, api_utils_1.successResponse)(asset);
        }
        catch (error) {
            console.error(`Error fetching ${this.operations.modelName} asset:`, error);
            return (0, api_utils_1.errorResponse)('Failed to fetch asset details. Please try again later.');
        }
    }
    // Create a new asset
    async create(user, body) {
        try {
            // Validate required fields
            const validationErrors = {};
            if (this.operations.requiredFields) {
                for (const field of this.operations.requiredFields) {
                    if (body[field] === undefined || body[field] === null || body[field] === "") {
                        validationErrors[String(field)] = `${String(field)} is required`;
                    }
                }
            }
            // Validate custom fields if they exist
            if (body.customFields) {
                // Get custom fields for this asset type and tenant
                const customFields = await this.db.customField.findMany({
                    where: {
                        tenantId: user.tenantId,
                        modelType: this.operations.modelName
                    }
                });
                // Validate each custom field
                for (const customField of customFields) {
                    const fieldValue = body.customFields[customField.name];
                    // Check required fields
                    if (customField.required && (fieldValue === undefined || fieldValue === null || fieldValue === "")) {
                        validationErrors[`customFields.${customField.name}`] = `${customField.name} is required`;
                    }
                    // Type validation for non-empty values
                    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
                        switch (customField.type) {
                            case 'number':
                                const numValue = Number(fieldValue);
                                if (isNaN(numValue)) {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid number`;
                                }
                                break;
                            case 'date':
                                // Handle both date strings and Date objects
                                const dateValue = new Date(fieldValue);
                                if (isNaN(dateValue.getTime())) {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid date`;
                                }
                                break;
                            case 'boolean':
                                // Accept boolean values, 'true' and 'false' strings
                                if (typeof fieldValue !== 'boolean' && fieldValue !== 'true' && fieldValue !== 'false') {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a boolean value (true/false)`;
                                }
                                break;
                            case 'text':
                            case 'textarea':
                                // For text fields, just ensure it's a string
                                if (typeof fieldValue !== 'string') {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a text value`;
                                }
                                break;
                            case 'select':
                                // For select fields, ensure it's a string
                                if (typeof fieldValue !== 'string') {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid selection`;
                                }
                                break;
                            default:
                                // For any other field type, ensure it's a string
                                if (typeof fieldValue !== 'string') {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid text value`;
                                }
                                break;
                        }
                    }
                }
            }
            // Return validation errors if any
            if (Object.keys(validationErrors).length > 0) {
                return (0, api_utils_1.validationErrorResponse)(validationErrors);
            }
            // Check if asset with unique field already exists
            if (this.operations.uniqueField && body[this.operations.uniqueField]) {
                // For Printer model, we use findFirst instead of findUnique since we removed the @unique constraint
                let existingAsset;
                if (this.operations.modelName === 'Printer') {
                    existingAsset = await this.db[this.operations.modelName].findFirst({
                        where: {
                            [this.operations.uniqueField]: body[this.operations.uniqueField],
                            tenantId: user.tenantId
                        }
                    });
                }
                else {
                    existingAsset = await this.db[this.operations.modelName].findUnique({
                        where: { [this.operations.uniqueField]: body[this.operations.uniqueField] }
                    });
                }
                if (existingAsset) {
                    return (0, api_utils_1.conflictResponse)(`${this.operations.modelName} with this ${String(this.operations.uniqueField)} already exists`);
                }
            }
            // Filter out undefined values to prevent setting fields to undefined
            const createData = Object.keys(body || {}).reduce((acc, key) => {
                if (body[key] !== undefined) {
                    acc[key] = body[key];
                }
                return acc;
            }, {});
            const asset = await this.db[this.operations.modelName].create({
                data: Object.assign(Object.assign({}, createData), { tenantId: user.tenantId }),
                select: Object.assign({ id: true, createdAt: true, updatedAt: true, tenantId: true }, this.getSelectFieldsForAssetType())
            });
            // Create history record after asset creation
            try {
                await this.db.history.create({
                    data: {
                        action: 'create',
                        modelType: this.operations.modelName,
                        recordId: asset.id,
                        changes: body,
                        userId: user.id,
                        tenantId: user.tenantId
                    }
                });
            }
            catch (historyError) {
                console.error(`Failed to create history record for ${this.operations.modelName}:`, historyError);
                // Continue with the operation even if history creation fails
            }
            // Emit real-time event
            try {
                (0, realtime_1.emitAssetChange)(user.tenantId, this.operations.modelName.toLowerCase(), 'create', asset);
            }
            catch (emitError) {
                console.error('Failed to emit real-time event:', emitError);
            }
            return (0, api_utils_1.successResponse)(asset, 201);
        }
        catch (error) {
            console.error(`Error creating ${this.operations.modelName} asset:`, error);
            // Handle Prisma-specific errors
            if (error.code === 'P2002') {
                // Unique constraint violation
                return (0, api_utils_1.conflictResponse)('An asset with this identifier already exists.');
            }
            return (0, api_utils_1.errorResponse)('Failed to create asset. Please try again later.');
        }
    }
    // Update an existing asset
    async update(user, id, body) {
        try {
            console.log(`Updating ${this.operations.modelName} asset ${id} with data:`, body);
            // Check if asset exists and belongs to user's tenant
            const existingAsset = await this.db[this.operations.modelName].findUnique({
                where: {
                    id,
                    tenantId: user.tenantId
                }
            });
            if (!existingAsset) {
                console.log(`Asset ${id} not found for tenant ${user.tenantId}`);
                return (0, api_utils_1.notFoundResponse)(`${this.operations.modelName} asset not found`);
            }
            // Validate required fields if they're being updated
            const validationErrors = {};
            if (this.operations.requiredFields) {
                for (const field of this.operations.requiredFields) {
                    // Only validate if the field is being updated
                    if (field in body && (body[field] === undefined || body[field] === null || body[field] === "")) {
                        validationErrors[String(field)] = `${String(field)} is required`;
                    }
                    // If field is not being updated, ensure it exists in the existing asset
                    if (!(field in body) && (existingAsset[field] === undefined || existingAsset[field] === null || existingAsset[field] === "")) {
                        validationErrors[String(field)] = `${String(field)} is required`;
                    }
                }
            }
            // Validate custom fields if they exist
            if (body.customFields) {
                // Get custom fields for this asset type and tenant
                const customFields = await this.db.customField.findMany({
                    where: {
                        tenantId: user.tenantId,
                        modelType: this.operations.modelName
                    }
                });
                // Validate each custom field
                for (const customField of customFields) {
                    const fieldValue = body.customFields[customField.name];
                    // Check required fields
                    if (customField.required && (fieldValue === undefined || fieldValue === null || fieldValue === "")) {
                        validationErrors[`customFields.${customField.name}`] = `${customField.name} is required`;
                    }
                    // Type validation for non-empty values
                    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
                        switch (customField.type) {
                            case 'number':
                                const numValue = Number(fieldValue);
                                if (isNaN(numValue)) {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid number`;
                                }
                                break;
                            case 'date':
                                // Handle both date strings and Date objects
                                const dateValue = new Date(fieldValue);
                                if (isNaN(dateValue.getTime())) {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid date`;
                                }
                                break;
                            case 'boolean':
                                // Accept boolean values, 'true' and 'false' strings
                                if (typeof fieldValue !== 'boolean' && fieldValue !== 'true' && fieldValue !== 'false') {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a boolean value (true/false)`;
                                }
                                break;
                            case 'text':
                            case 'textarea':
                                // For text fields, just ensure it's a string
                                if (typeof fieldValue !== 'string') {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a text value`;
                                }
                                break;
                            case 'select':
                                // For select fields, ensure it's a string
                                if (typeof fieldValue !== 'string') {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid selection`;
                                }
                                break;
                            default:
                                // For any other field type, ensure it's a string
                                if (typeof fieldValue !== 'string') {
                                    validationErrors[`customFields.${customField.name}`] = `${customField.name} must be a valid text value`;
                                }
                                break;
                        }
                    }
                }
            }
            // Return validation errors if any
            if (Object.keys(validationErrors).length > 0) {
                console.log("Validation errors:", validationErrors);
                return (0, api_utils_1.validationErrorResponse)(validationErrors);
            }
            // Check if unique field is being updated and already exists for another asset
            if (this.operations.uniqueField && body[this.operations.uniqueField] &&
                body[this.operations.uniqueField] !== existingAsset[this.operations.uniqueField]) {
                // For Printer model, we use findFirst instead of findUnique since we removed the @unique constraint
                let existingAssetWithUniqueField;
                if (this.operations.modelName === 'Printer') {
                    existingAssetWithUniqueField = await this.db[this.operations.modelName].findFirst({
                        where: {
                            [this.operations.uniqueField]: body[this.operations.uniqueField],
                            tenantId: user.tenantId,
                            NOT: { id: id }
                        }
                    });
                }
                else {
                    existingAssetWithUniqueField = await this.db[this.operations.modelName].findUnique({
                        where: {
                            [this.operations.uniqueField]: body[this.operations.uniqueField],
                            NOT: { id: id }
                        }
                    });
                }
                if (existingAssetWithUniqueField) {
                    console.log(`Asset with ${String(this.operations.uniqueField)} ${body[this.operations.uniqueField]} already exists`);
                    return (0, api_utils_1.conflictResponse)(`${this.operations.modelName} with this ${String(this.operations.uniqueField)} already exists`);
                }
            }
            // Create history record for changes
            const changes = {};
            Object.keys(body).forEach(key => {
                // Skip undefined values to avoid setting fields to undefined
                if (body[key] !== undefined &&
                    body[key] !== existingAsset[key]) {
                    changes[key] = {
                        from: existingAsset[key],
                        to: body[key]
                    };
                }
            });
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
                    });
                }
                catch (historyError) {
                    console.error(`Failed to create history record for ${this.operations.modelName}:`, historyError);
                    // Continue with the operation even if history creation fails
                }
            }
            // Filter out undefined values to prevent setting fields to undefined
            // Also filter out invalid fields that don't exist in the model
            const validFields = {
                'PC': ['dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'pcName', 'userName', 'status', 'note', 'customFields'],
                'Laptop': ['dept', 'barcode', 'sapBarcode', 'dateBuy', 'email', 'model', 'status', 'userName', 'customFields'],
                'Printer': ['dept', 'location', 'ip', 'model', 'color', 'barcode', 'sapCode', 'date', 'note', 'customFields'],
                'License': ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip', 'date', 'updateStatus', 'customFields'],
                'WarehouseIT': ['cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'status', 'note', 'customFields']
            };
            const modelValidFields = validFields[this.operations.modelName] || [];
            console.log(`Valid fields for ${this.operations.modelName}:`, modelValidFields);
            const updateData = Object.keys(body || {}).reduce((acc, key) => {
                // Only include valid fields for this model and non-undefined values
                // Allow both direct fields and customFields to be updated
                if ((modelValidFields.includes(key) || key === 'customFields') && body[key] !== undefined) {
                    acc[key] = body[key];
                }
                else {
                    console.log(`Skipping field ${key} - not valid or undefined`);
                }
                return acc;
            }, {});
            console.log("Update data to be sent to database:", updateData);
            const asset = await this.db[this.operations.modelName].update({
                where: {
                    id,
                    tenantId: user.tenantId
                },
                data: updateData,
                select: Object.assign({ id: true, createdAt: true, updatedAt: true, tenantId: true }, this.getSelectFieldsForAssetType())
            });
            // Emit real-time event
            try {
                (0, realtime_1.emitAssetChange)(user.tenantId, this.operations.modelName.toLowerCase(), 'update', asset);
            }
            catch (emitError) {
                console.error('Failed to emit real-time event:', emitError);
            }
            return (0, api_utils_1.successResponse)(asset);
        }
        catch (error) {
            if (error.code === 'P2025') {
                console.log(`Asset ${id} not found during update`);
                return (0, api_utils_1.notFoundResponse)(`${this.operations.modelName} asset not found`);
            }
            console.error(`Error updating ${this.operations.modelName} asset:`, error);
            // Handle Prisma-specific errors
            if (error.code === 'P2002') {
                // Unique constraint violation
                return (0, api_utils_1.conflictResponse)('An asset with this identifier already exists.');
            }
            return (0, api_utils_1.errorResponse)('Failed to update asset. Please try again later.');
        }
    }
    // Delete an asset
    async delete(user, id) {
        try {
            // Check if asset exists and belongs to user's tenant
            const existingAsset = await this.db[this.operations.modelName].findUnique({
                where: {
                    id,
                    tenantId: user.tenantId
                }
            });
            if (!existingAsset) {
                return (0, api_utils_1.notFoundResponse)(`${this.operations.modelName} asset not found`);
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
                });
            }
            catch (historyError) {
                console.error(`Failed to create history record for ${this.operations.modelName}:`, historyError);
                // Continue with the operation even if history creation fails
            }
            await this.db[this.operations.modelName].delete({
                where: {
                    id,
                    tenantId: user.tenantId
                }
            });
            // Emit real-time event
            try {
                (0, realtime_1.emitAssetChange)(user.tenantId, this.operations.modelName.toLowerCase(), 'delete', { id });
            }
            catch (emitError) {
                console.error('Failed to emit real-time event:', emitError);
            }
            return (0, api_utils_1.successResponse)(null, 204);
        }
        catch (error) {
            if (error.code === 'P2025') {
                return (0, api_utils_1.notFoundResponse)(`${this.operations.modelName} asset not found`);
            }
            console.error(`Error deleting ${this.operations.modelName} asset:`, error);
            return (0, api_utils_1.errorResponse)('Failed to delete asset. Please try again later.');
        }
    }
    // Bulk delete assets with optimized batch processing
    async bulkDelete(user, ids) {
        try {
            // Validate input
            if (!ids || ids.length === 0) {
                return (0, api_utils_1.badRequestResponse)('No asset IDs provided');
            }
            // Process in batches to avoid memory issues with large datasets
            const batchSize = 100;
            let totalDeleted = 0;
            // Process IDs in batches
            for (let i = 0; i < ids.length; i += batchSize) {
                const batchIds = ids.slice(i, i + batchSize);
                // Check if all assets in batch exist and belong to user's tenant
                const existingAssets = await this.db[this.operations.modelName].findMany({
                    where: {
                        id: { in: batchIds },
                        tenantId: user.tenantId
                    },
                    select: {
                        id: true,
                        tenantId: true
                    }
                });
                // Check if all requested assets were found
                const foundIds = existingAssets.map((asset) => asset.id);
                const missingIds = batchIds.filter(id => !foundIds.includes(id));
                if (missingIds.length > 0) {
                    return (0, api_utils_1.notFoundResponse)(`Some ${this.operations.modelName} assets not found: ${missingIds.join(', ')}`);
                }
                // Create history records for each asset in batch
                // Use Promise.all for parallel processing
                const historyPromises = existingAssets.map((asset) => this.db.history.create({
                    data: {
                        action: 'delete',
                        modelType: this.operations.modelName,
                        recordId: asset.id,
                        changes: asset,
                        userId: user.id,
                        tenantId: user.tenantId
                    }
                }).catch((historyError) => {
                    console.error(`Failed to create history record for asset ${asset.id}:`, historyError);
                    // Continue with deletion even if history creation fails
                }));
                // Wait for all history records to be created
                await Promise.all(historyPromises);
                // Delete all assets in batch
                const deleteResult = await this.db[this.operations.modelName].deleteMany({
                    where: {
                        id: { in: batchIds },
                        tenantId: user.tenantId
                    }
                });
                totalDeleted += deleteResult.count;
            }
            // Log the number of deleted assets
            console.log(`Deleted ${totalDeleted} ${this.operations.modelName} assets in ${Math.ceil(ids.length / batchSize)} batches`);
            // Emit real-time events for each deleted asset
            try {
                ids.forEach(id => {
                    (0, realtime_1.emitAssetChange)(user.tenantId, this.operations.modelName.toLowerCase(), 'delete', { id });
                });
            }
            catch (emitError) {
                console.error('Failed to emit real-time events:', emitError);
            }
            return (0, api_utils_1.successResponse)(null, 204);
        }
        catch (error) {
            console.error(`Error bulk deleting ${this.operations.modelName} assets:`, error);
            // Handle Prisma-specific errors
            if (error.code === 'P2025') {
                return (0, api_utils_1.notFoundResponse)(`${this.operations.modelName} assets not found`);
            }
            return (0, api_utils_1.errorResponse)('Failed to delete assets. Please try again later.');
        }
    }
}
exports.AssetApiHandler = AssetApiHandler;
// Create handler for PC assets
exports.pcHandler = new AssetApiHandler(db_1.db, {
    modelName: 'PC',
    requiredFields: ['dept', 'cpuBarcode', 'pcName', 'status'],
    uniqueField: 'cpuBarcode',
    searchFields: ['cpuBarcode', 'pcName', 'dept', 'note']
    // Remove the include option as customFields is a scalar field, not a relation
});
// Create handler for Laptop assets
exports.laptopHandler = new AssetApiHandler(db_1.db, {
    modelName: 'Laptop',
    requiredFields: ['dept', 'barcode', 'status'],
    uniqueField: 'barcode',
    searchFields: ['barcode', 'userName', 'dept', 'model']
});
// Create handler for Printer assets
exports.printerHandler = new AssetApiHandler(db_1.db, {
    modelName: 'Printer',
    requiredFields: ['dept', 'barcode', 'color'],
    uniqueField: 'barcode',
    searchFields: ['barcode', 'dept', 'model', 'ip', 'note']
});
// Create handler for License assets
exports.licenseHandler = new AssetApiHandler(db_1.db, {
    modelName: 'License',
    requiredFields: ['productKey'],
    searchFields: ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip', 'updateStatus']
});
// Create handler for WarehouseIT assets
exports.warehouseHandler = new AssetApiHandler(db_1.db, {
    modelName: 'WarehouseIT',
    requiredFields: ['status'],
    searchFields: ['cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'status', 'note']
});
