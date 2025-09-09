import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge class names with tailwind-merge
 * This is used by shadcn components for conditional class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility function to format dates consistently across the application
 * @param date Date string or Date object to format
 * @param options Optional Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric"
  }
) {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return "";
  
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

/**
 * Utility function to format dates in DD/MM/YYYY format for display
 * @param date Date string or Date object to format
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDisplayDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return "";
    
    // Format as DD/MM/YYYY
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(dateObj);
  } catch (e) {
    return "";
  }
}

/**
 * Utility function to format dates for input fields (YYYY-MM-DD format)
 * @param date Date string or Date object to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatInputDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return "";
    
    // Format as YYYY-MM-DD for input fields
    const result = dateObj.toISOString().split('T')[0];
    return result || "";
  } catch (e) {
    return "";
  }
}