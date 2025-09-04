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
exports.defaultLanguage = exports.supportedLanguages = void 0;
exports.getTranslations = getTranslations;
exports.t = t;
exports.translate = translate;
exports.hasTranslation = hasTranslation;
exports.getApplicationName = getApplicationName;
exports.setApplicationName = setApplicationName;
exports.supportedLanguages = ['en', 'zh-tw'];
// Default language
exports.defaultLanguage = 'en';
// Function to dynamically import translation files
async function loadTranslations(lang) {
    try {
        const translations = await Promise.resolve(`${`@/locales/${lang}.json`}`).then(s => __importStar(require(s)));
        return translations.default;
    }
    catch (error) {
        console.warn(`Failed to load translations for ${lang}, falling back to default`);
        try {
            const defaultTranslations = await Promise.resolve(`${`@/locales/${exports.defaultLanguage}.json`}`).then(s => __importStar(require(s)));
            return defaultTranslations.default;
        }
        catch (defaultError) {
            console.error('Failed to load default translations', defaultError);
            return {};
        }
    }
}
// Get all translations for a language
async function getTranslations(lang) {
    const currentLang = lang || exports.defaultLanguage;
    return await loadTranslations(currentLang);
}
// Get translation for a key with optional parameters
function t(key, translations, ...params) {
    // Navigate through the translation object using the key path
    const keyParts = key.split('.');
    let translation = translations;
    for (const part of keyParts) {
        if (translation && typeof translation === 'object' && part in translation) {
            translation = translation[part];
        }
        else {
            // Return the key if translation not found
            return key;
        }
    }
    // If we found a translation string, process parameters
    if (typeof translation === 'string') {
        // Replace placeholders {0}, {1}, etc. with provided parameters
        params.forEach((param, index) => {
            // Escape special regex characters in param
            const escapedParam = String(param).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            translation = translation.replace(new RegExp(`\\{${index}\\}`, 'g'), escapedParam);
        });
        return translation;
    }
    // Return the key if translation is not a string
    return key;
}
// Enhanced translation function with fallback and error handling
function translate(key, translations, fallback = key, ...params) {
    try {
        // Navigate through the translation object using the key path
        const keyParts = key.split('.');
        let translation = translations;
        for (const part of keyParts) {
            if (translation && typeof translation === 'object' && part in translation) {
                translation = translation[part];
            }
            else {
                // Return fallback if translation not found
                return processParams(fallback, params);
            }
        }
        // If we found a translation string, process parameters
        if (typeof translation === 'string') {
            return processParams(translation, params);
        }
        // Return fallback if translation is not a string
        return processParams(fallback, params);
    }
    catch (error) {
        console.error(`Error translating key "${key}":`, error);
        return processParams(fallback, params);
    }
}
// Helper function to process parameters in translation strings
function processParams(template, params) {
    if (!params || params.length === 0) {
        return template;
    }
    let result = template;
    params.forEach((param, index) => {
        // Escape special regex characters in param
        const escapedParam = String(param).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), escapedParam);
    });
    return result;
}
// Function to check if a translation key exists
function hasTranslation(key, translations) {
    try {
        const keyParts = key.split('.');
        let translation = translations;
        for (const part of keyParts) {
            if (translation && typeof translation === 'object' && part in translation) {
                translation = translation[part];
            }
            else {
                return false;
            }
        }
        return typeof translation === 'string';
    }
    catch (error) {
        return false;
    }
}
// Function to get application name from localStorage or default
function getApplicationName() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('applicationName') || 'IT Asset Management';
    }
    return 'IT Asset Management';
}
// Function to set application name in localStorage
function setApplicationName(name) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('applicationName', name);
    }
}
