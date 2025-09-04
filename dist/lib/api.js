"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.ValidationError = exports.ApiError = void 0;
const axios_1 = __importDefault(require("axios"));
// Define custom error types
class ApiError extends Error {
    constructor(status, message, data) {
        super(message);
        this.status = status;
        this.message = message;
        this.data = data;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
class ValidationError extends ApiError {
    constructor(message, validationErrors, data) {
        super(400, message, data);
        this.name = 'ValidationError';
        this.validationErrors = validationErrors;
    }
}
exports.ValidationError = ValidationError;
// Create an axios instance with default configuration
const apiClient = axios_1.default.create({
    baseURL: '/api',
    timeout: 30000, // Increased timeout
    headers: {
        'Content-Type': 'application/json',
    },
});
// Request interceptor
apiClient.interceptors.request.use((config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth-token');
        if (token) {
            config.headers = Object.assign(Object.assign({}, config.headers), { Authorization: `Bearer ${token}` });
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Response interceptor
apiClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    // Handle common error responses
    if (axios_1.default.isAxiosError(error)) {
        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
            // Clear token and redirect to login if unauthorized
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-token');
                // Only redirect if we're not already on the login page
                if (window.location.pathname !== '/auth/login') {
                    window.location.href = '/auth/login';
                }
            }
        }
        else if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 403) {
            // For forbidden access, show a toast message instead of logging out
            if (typeof window !== 'undefined') {
                // Don't redirect, just show an error message
                const errorMessage = ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) || ((_f = (_e = error.response) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.message) || 'You do not have permission to perform this action';
                // We can't use toast here directly because it's not available in this file
                // The error will be handled by the calling component
                // Using errorMessage to prevent TypeScript error
                console.warn('403 Forbidden -', errorMessage);
            }
        }
    }
    // Create appropriate error based on response
    let apiError;
    if (axios_1.default.isAxiosError(error)) {
        const status = ((_g = error.response) === null || _g === void 0 ? void 0 : _g.status) || 500;
        const errorMessage = ((_j = (_h = error.response) === null || _h === void 0 ? void 0 : _h.data) === null || _j === void 0 ? void 0 : _j.error) || ((_l = (_k = error.response) === null || _k === void 0 ? void 0 : _k.data) === null || _l === void 0 ? void 0 : _l.message) || error.message || 'An unexpected error occurred';
        const errorData = (_m = error.response) === null || _m === void 0 ? void 0 : _m.data;
        // Check if it's a validation error
        if (status === 400 && ((_o = errorData === null || errorData === void 0 ? void 0 : errorData.details) === null || _o === void 0 ? void 0 : _o.type) === 'validation') {
            apiError = new ValidationError(errorMessage, errorData.details.validationErrors, errorData);
        }
        else {
            apiError = new ApiError(status, errorMessage, errorData);
        }
    }
    else {
        apiError = new ApiError(500, 'An unexpected error occurred', undefined);
    }
    return Promise.reject(apiError);
});
// Wrapper functions for common HTTP methods
exports.api = {
    get: async (url, config) => {
        try {
            const response = await apiClient.get(url, config);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    post: async (url, data, config) => {
        try {
            const response = await apiClient.post(url, data, config);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    put: async (url, data, config) => {
        try {
            const response = await apiClient.put(url, data, config);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    delete: async (url, config) => {
        try {
            const response = await apiClient.delete(url, config);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    },
    // Helper function to set token
    setToken: (token) => {
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth-token', token);
            }
        }
        else {
            delete apiClient.defaults.headers.common['Authorization'];
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-token');
            }
        }
    },
    // Helper function to get token
    getToken: () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth-token');
        }
        return null;
    }
};
exports.default = apiClient;
