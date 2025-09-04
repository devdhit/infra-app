"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.getCurrentUser = getCurrentUser;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const db_1 = require("@/lib/db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Use environment-specific JWT secret with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
const SALT_ROUNDS = 10;
// Token expiration based on environment
const TOKEN_EXPIRATION = process.env.NODE_ENV === 'production' ? '24h' : '7d';
/**
 * Generate a JWT token for a user
 */
function generateToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
    }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}
/**
 * Verify a JWT token and return the payload
 */
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
/**
 * Get the current user from the request
 */
async function getCurrentUser(request) {
    var _a;
    try {
        // First check for token in Authorization header (Bearer token)
        const authHeader = request.headers.get('authorization');
        let token;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
        }
        // Fallback to checking cookies
        else {
            token = (_a = request.cookies.get('auth-token')) === null || _a === void 0 ? void 0 : _a.value;
        }
        if (!token)
            return null;
        const payload = verifyToken(token);
        if (!payload)
            return null;
        // Check if token is expired
        if (payload.exp * 1000 < Date.now())
            return null;
        // Fetch user from database
        const user = await db_1.db.user.findUnique({
            where: { id: payload.id },
            include: { tenant: true }
        });
        return user;
    }
    catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}
/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    return await bcryptjs_1.default.hash(password, SALT_ROUNDS);
}
/**
 * Verify a password using bcrypt
 */
async function verifyPassword(password, hash) {
    return await bcryptjs_1.default.compare(password, hash);
}
