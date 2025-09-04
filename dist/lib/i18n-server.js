"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentLanguage = getCurrentLanguage;
const headers_1 = require("next/headers");
const i18n_1 = require("@/lib/i18n");
// Get the current language from cookies, headers, or middleware
async function getCurrentLanguage() {
    // Try to get language from cookies first
    const cookieStore = await (0, headers_1.cookies)();
    const langCookie = cookieStore.get('NEXT_LOCALE');
    if ((langCookie === null || langCookie === void 0 ? void 0 : langCookie.value) && i18n_1.supportedLanguages.includes(langCookie.value)) {
        return langCookie.value;
    }
    // Try to get language from request headers (set by middleware)
    const headersList = await (0, headers_1.headers)();
    const localeHeader = headersList.get('x-locale');
    if (localeHeader && i18n_1.supportedLanguages.includes(localeHeader)) {
        return localeHeader;
    }
    // Try to get language from Accept-Language header
    const acceptLanguage = headersList.get('accept-language');
    if (acceptLanguage) {
        const languages = acceptLanguage.split(',');
        for (const lang of languages) {
            const parts = lang.split(';');
            if (parts.length > 0 && parts[0] !== undefined) {
                const cleanLang = parts[0].trim().toLowerCase();
                if (cleanLang === 'zh-tw' || cleanLang === 'zh-hant') {
                    return 'zh-tw';
                }
                if (cleanLang.startsWith('en')) {
                    return 'en';
                }
            }
        }
    }
    // Default to English
    return i18n_1.defaultLanguage;
}
