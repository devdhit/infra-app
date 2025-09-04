import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Cross-platform path utilities to handle differences between Windows and Unix systems
 */

// Helper function to get __dirname in ES modules
export function getDirName(metaUrl: string): string {
  return dirname(fileURLToPath(metaUrl));
}

// Helper function to resolve paths consistently across platforms
export function resolvePath(...paths: string[]): string {
  return path.resolve(...paths);
}

// Helper function to normalize paths for the current platform
export function normalizePath(p: string): string {
  return path.normalize(p);
}

// Helper function to join paths consistently across platforms
export function joinPath(...paths: string[]): string {
  return path.join(...paths);
}

// Get the project root directory
export function getProjectRoot(): string {
  // In development (Windows), use the current directory
  // In production (Ubuntu), use /opt/itams
  return process.env.NODE_ENV === 'production' 
    ? '/opt/itams' 
    : process.cwd();
}

// Get the dist directory path
export function getDistPath(): string {
  return joinPath(getProjectRoot(), 'dist');
}

// Get the src directory path
export function getSrcPath(): string {
  return joinPath(getProjectRoot(), 'src');
}

// Check if we're running on Windows
export function isWindows(): boolean {
  return process.platform === 'win32';
}

// Check if we're running on Linux/Unix
export function isUnix(): boolean {
  return process.platform === 'linux' || process.platform === 'darwin';
}