"use strict";
// Utility functions for custom field handling
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateData = exports.getFieldValue = exports.isCustomField = exports.getModelType = void 0;
/**
 * Map asset type to model type for custom fields
 * Asset types in pages are lowercase (e.g., "pc", "laptop")
 * but model types in custom fields are PascalCase (e.g., "PC", "Laptop")
 */
const getModelType = (assetType) => {
    const modelTypeMap = {
        pc: "PC",
        laptop: "Laptop",
        printer: "Printer",
        license: "License",
        warehouse: "WarehouseIT"
    };
    return modelTypeMap[assetType] || assetType;
};
exports.getModelType = getModelType;
/**
 * Determine if a field is a custom field
 * @param fieldName - The name of the field
 * @param asset - The asset object
 * @param customFieldsData - The custom fields data from the API
 * @returns boolean indicating if the field is a custom field
 */
const isCustomField = (fieldName, asset, customFieldsData) => {
    // Check if the field exists in customFieldsData - this is the primary way to determine if a field is custom
    if (customFieldsData) {
        return customFieldsData.some((cf) => cf.name === fieldName);
    }
    // Fallback: check if field exists in asset.customFields but not directly on asset
    // This is a more reliable check than just checking if the field exists in customFields
    return asset.customFields &&
        fieldName in asset.customFields &&
        !(fieldName in asset);
};
exports.isCustomField = isCustomField;
/**
 * Get the value of a field, handling both standard and custom fields
 * @param fieldName - The name of the field
 * @param asset - The asset object
 * @param isCustom - Whether the field is a custom field (optional, will be determined if not provided)
 * @returns The value of the field
 */
const getFieldValue = (fieldName, asset, isCustom) => {
    var _a, _b;
    // If explicitly specified as custom field, get from customFields
    if (isCustom === true) {
        return (_b = (_a = asset.customFields) === null || _a === void 0 ? void 0 : _a[fieldName]) !== null && _b !== void 0 ? _b : null;
    }
    // If explicitly specified as standard field, get directly from asset
    if (isCustom === false) {
        return asset[fieldName];
    }
    // If not specified, determine based on field existence
    if (asset.customFields && fieldName in asset.customFields) {
        return asset.customFields[fieldName];
    }
    return asset[fieldName];
};
exports.getFieldValue = getFieldValue;
/**
 * Create update data structure for API requests
 * @param fieldName - The name of the field being updated
 * @param value - The new value
 * @param isCustom - Whether the field is a custom field
 * @param asset - The asset object (needed for custom fields to preserve existing custom fields)
 * @returns The data structure for the API request
 */
const createUpdateData = (fieldName, value, isCustom, asset) => {
    if (isCustom) {
        // For custom fields, we need to send the customFields object
        const currentCustomFields = (asset === null || asset === void 0 ? void 0 : asset.customFields) || {};
        return {
            customFields: Object.assign(Object.assign({}, currentCustomFields), { [fieldName]: value })
        };
    }
    else {
        // For standard fields, send the field directly
        return { [fieldName]: value };
    }
};
exports.createUpdateData = createUpdateData;
