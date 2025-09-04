"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationSettings = getApplicationSettings;
exports.updateApplicationSettings = updateApplicationSettings;
exports.resetApplicationSettings = resetApplicationSettings;
const api_1 = require("@/lib/api");
// Get application settings
async function getApplicationSettings() {
    const response = await api_1.api.get('/application');
    return response;
}
// Update application settings
async function updateApplicationSettings(data) {
    const response = await api_1.api.post('/application', data);
    return response;
}
// Reset application settings to default
async function resetApplicationSettings() {
    const response = await api_1.api.post('/application', {
        applicationName: 'IT Asset Management'
    });
    return response;
}
