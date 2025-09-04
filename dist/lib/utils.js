"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatDate = formatDate;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
/**
 * Utility function to merge class names with tailwind-merge
 * This is used by shadcn components for conditional class names
 */
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
/**
 * Utility function to format dates consistently across the application
 * @param date Date string or Date object to format
 * @param options Optional Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string
 */
function formatDate(date, options = {
    year: "numeric",
    month: "short",
    day: "numeric"
}) {
    if (!date)
        return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    // Check if date is valid
    if (isNaN(dateObj.getTime()))
        return "";
    return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}
