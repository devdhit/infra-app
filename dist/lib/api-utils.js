"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.notFoundResponse = notFoundResponse;
exports.unauthorizedResponse = unauthorizedResponse;
exports.badRequestResponse = badRequestResponse;
exports.conflictResponse = conflictResponse;
exports.validationErrorResponse = validationErrorResponse;
exports.parseRequestBody = parseRequestBody;
exports.getQueryParams = getQueryParams;
// Standardized API response helper functions
function successResponse(data, status = 200) {
    // For 204 No Content, don't send a body
    if (status === 204) {
        return new Response(null, {
            status,
            headers: {}
        });
    }
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
function errorResponse(message, status = 500, options) {
    if (!(options === null || options === void 0 ? void 0 : options.quiet)) {
        console.error(`API Error [${status}]: ${message}`, (options === null || options === void 0 ? void 0 : options.details) || '');
    }
    return new Response(JSON.stringify(Object.assign({ error: message, status }, ((options === null || options === void 0 ? void 0 : options.details) && { details: options.details }))), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
function notFoundResponse(message = 'Resource not found') {
    return errorResponse(message, 404);
}
function unauthorizedResponse() {
    return errorResponse('Unauthorized', 401);
}
function badRequestResponse(message = 'Bad request', details) {
    return errorResponse(message, 400, { details });
}
function conflictResponse(message = 'Conflict', details) {
    return errorResponse(message, 409, { details });
}
function validationErrorResponse(errors) {
    return errorResponse('Validation failed', 400, {
        details: {
            validationErrors: errors,
            type: 'validation'
        }
    });
}
// Parse request body helper
async function parseRequestBody(request) {
    try {
        // Check if content type is JSON
        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Content-Type must be application/json');
        }
        return await request.json();
    }
    catch (error) {
        throw new Error(`Invalid JSON in request body: ${error.message}`);
    }
}
// Extract query parameters with defaults
function getQueryParams(request) {
    const { searchParams } = new URL(request.url);
    return {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || '',
        status: searchParams.get('status') || ''
    };
}
