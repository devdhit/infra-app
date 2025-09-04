"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirName = getDirName;
exports.resolvePath = resolvePath;
exports.normalizePath = normalizePath;
exports.joinPath = joinPath;
exports.getProjectRoot = getProjectRoot;
exports.getDistPath = getDistPath;
exports.getSrcPath = getSrcPath;
exports.isWindows = isWindows;
exports.isUnix = isUnix;
const path = __importStar(require("path"));
const url_1 = require("url");
const path_1 = require("path");
/**
 * Cross-platform path utilities to handle differences between Windows and Unix systems
 */
// Helper function to get __dirname in ES modules
function getDirName(metaUrl) {
    return (0, path_1.dirname)((0, url_1.fileURLToPath)(metaUrl));
}
// Helper function to resolve paths consistently across platforms
function resolvePath(...paths) {
    return path.resolve(...paths);
}
// Helper function to normalize paths for the current platform
function normalizePath(p) {
    return path.normalize(p);
}
// Helper function to join paths consistently across platforms
function joinPath(...paths) {
    return path.join(...paths);
}
// Get the project root directory
function getProjectRoot() {
    // In development (Windows), use the current directory
    // In production (Ubuntu), use /opt/itams
    return process.env.NODE_ENV === 'production'
        ? '/opt/itams'
        : process.cwd();
}
// Get the dist directory path
function getDistPath() {
    return joinPath(getProjectRoot(), 'dist');
}
// Get the src directory path
function getSrcPath() {
    return joinPath(getProjectRoot(), 'src');
}
// Check if we're running on Windows
function isWindows() {
    return process.platform === 'win32';
}
// Check if we're running on Linux/Unix
function isUnix() {
    return process.platform === 'linux' || process.platform === 'darwin';
}
