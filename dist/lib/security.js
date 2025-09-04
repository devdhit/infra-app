"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSP_HEADER = exports.RateLimiter = void 0;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateToken = generateToken;
exports.sanitizeInput = sanitizeInput;
exports.validateEmail = validateEmail;
exports.validatePassword = validatePassword;
const bcryptjs_1 = require("bcryptjs");
// Hash a password
async function hashPassword(password) {
    return await (0, bcryptjs_1.hash)(password, 12);
}
// Verify a password
async function verifyPassword(password, hashedPassword) {
    return await (0, bcryptjs_1.compare)(password, hashedPassword);
}
// Generate a random token
function generateToken(length = 32) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
// Sanitize user input to prevent XSS
function sanitizeInput(input) {
    if (!input)
        return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
// Validate password strength
function validatePassword(password) {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character' };
    }
    return { isValid: true, message: 'Password is valid' };
}
// Rate limiting utility
class RateLimiter {
    constructor(windowMs = 60000, maxRequests = 100) {
        this.requests = new Map();
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }
    isAllowed(ip) {
        const now = Date.now();
        const requests = this.requests.get(ip) || [];
        // Remove requests outside the window
        const recentRequests = requests.filter(time => now - time < this.windowMs);
        // Check if limit exceeded
        if (recentRequests.length >= this.maxRequests) {
            return false;
        }
        // Add current request
        recentRequests.push(now);
        this.requests.set(ip, recentRequests);
        return true;
    }
}
exports.RateLimiter = RateLimiter;
// Content Security Policy
exports.CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, ' ').trim();
