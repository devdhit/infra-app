"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = require("node-fetch");
var os = require("os");
var child_process_1 = require("child_process");
// Function to get IP and MAC address
function getNetworkInfo() {
    try {
        var interfaces = os.networkInterfaces();
        for (var _i = 0, _a = Object.keys(interfaces); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            var iface = interfaces[name_1];
            if (!iface)
                continue;
            for (var _b = 0, iface_1 = iface; _b < iface_1.length; _b++) {
                var alias = iface_1[_b];
                if (alias.family === 'IPv4' && !alias.internal) {
                    return {
                        ip: alias.address,
                        mac: alias.mac
                    };
                }
            }
        }
        return { ip: '', mac: '' };
    }
    catch (error) {
        console.error('Error getting network info:', error);
        return { ip: '', mac: '' };
    }
}
// Function to get detailed OS information
function getOSInfo() {
    try {
        if (os.platform() === 'win32') {
            // For Windows, get detailed version information
            var productName = (0, child_process_1.execSync)('wmic os get Caption /value', { encoding: 'utf8' });
            var buildNumber = (0, child_process_1.execSync)('wmic os get BuildNumber /value', { encoding: 'utf8' });
            // Extract values from WMIC output
            var productMatch = productName.match(/Caption=(.+)/);
            var buildMatch = buildNumber.match(/BuildNumber=(.+)/);
            var product = productMatch && productMatch[1] ? productMatch[1].trim() : 'Windows';
            var build = buildMatch && buildMatch[1] ? buildMatch[1].trim() : os.release();
            // Determine Windows version based on build number
            var version = product;
            if (build.startsWith('1904')) {
                version = 'Windows 10';
            }
            else if (build.startsWith('22')) {
                version = 'Windows 11';
            }
            return {
                platform: os.platform(),
                release: version,
                build: build || '',
                arch: os.arch(),
                full: "".concat(version, " ").concat(os.arch(), " (Build ").concat(build, ")")
            };
        }
        else {
            // For other platforms, use standard OS module
            return {
                platform: os.platform(),
                release: os.release(),
                build: '',
                arch: os.arch(),
                full: "".concat(os.platform(), " ").concat(os.release(), " ").concat(os.arch())
            };
        }
    }
    catch (error) {
        console.error('Error getting OS info:', error);
        // Fallback to basic OS info
        return {
            platform: os.platform(),
            release: os.release(),
            build: '',
            arch: os.arch(),
            full: "".concat(os.platform(), " ").concat(os.release(), " ").concat(os.arch())
        };
    }
}
// Function to get system specs
function getSystemSpecs() {
    var totalMemory = Math.round(os.totalmem() / (1024 * 1024 * 1024)); // GB
    var cpus = os.cpus();
    return {
        totalMemory: totalMemory,
        cpuModel: cpus && cpus.length > 0 && cpus[0] ? cpus[0].model : 'Unknown',
        cpuCores: cpus.length
    };
}
// Function to get detailed disk information including SSD/HDD type
function getDiskInfo() {
    var _a;
    try {
        if (os.platform() === 'win32') {
            // For Windows, get detailed disk information
            var drives = [];
            try {
                // Get logical disks information with better error handling
                var logicalDisks = (0, child_process_1.execSync)('wmic logicaldisk where "DriveType=3" get Caption,Size,FileSystem /format:value', {
                    encoding: 'utf8',
                    timeout: 5000
                });
                // Split by the double newline that WMIC uses to separate records
                var records = logicalDisks.split('\r\r\n\r\r\n').filter(function (record) { return record.trim() !== ''; });
                for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
                    var record = records_1[_i];
                    var lines = record.split('\r\r\n').filter(function (line) { return line.trim() !== ''; });
                    var driveLetter = '';
                    var size = 0;
                    for (var _b = 0, lines_1 = lines; _b < lines_1.length; _b++) {
                        var line = lines_1[_b];
                        if (line.startsWith('Caption=')) {
                            driveLetter = line.substring(8).trim();
                        }
                        else if (line.startsWith('Size=')) {
                            var sizeMatch = line.substring(5).trim();
                            size = parseInt(sizeMatch) || 0;
                        }
                    }
                    if (driveLetter && !isNaN(size) && size > 0) {
                        var sizeGB = Math.round(size / (1024 * 1024 * 1024));
                        drives.push({
                            letter: driveLetter,
                            size: sizeGB
                        });
                    }
                }
            }
            catch (wmicError) {
                console.error('Error getting logical disk info:', wmicError.message);
                // Fallback to simpler method
                try {
                    var simpleDisks = (0, child_process_1.execSync)('wmic logicaldisk get Caption,Size', { encoding: 'utf8' });
                    var lines = simpleDisks.split('\n').filter(function (line) { return line.trim() !== '' && !line.includes('Caption'); });
                    for (var _c = 0, lines_2 = lines; _c < lines_2.length; _c++) {
                        var line = lines_2[_c];
                        var parts = line.trim().split(/\s+/);
                        if (parts.length >= 2) {
                            var driveLetter = parts[0];
                            var sizeStr = parts[1] || '';
                            var size = parseInt(sizeStr) || 0;
                            if (driveLetter && !isNaN(size) && size > 0) {
                                var sizeGB = Math.round(size / (1024 * 1024 * 1024));
                                drives.push({
                                    letter: driveLetter,
                                    size: sizeGB
                                });
                            }
                        }
                    }
                }
                catch (simpleError) {
                    console.error('Error with simple disk info:', simpleError.message);
                }
            }
            // If we still don't have drives, use a very simple fallback
            if (drives.length === 0) {
                try {
                    var fs = require('fs');
                    var root = 'C:\\';
                    if (fs.existsSync(root)) {
                        // We can't easily get the total size with fs, so we'll estimate
                        drives.push({
                            letter: 'C:',
                            size: 256 // Default estimate
                        });
                    }
                }
                catch (fsError) {
                    console.error('Filesystem fallback error:', fsError.message);
                }
            }
            // Format the output with proper SSD/HDD identification
            if (drives.length > 0) {
                var formattedDrives = drives.map(function (drive, index) {
                    // For a realistic approach, we'll assume:
                    // 1. The first drive (usually C:) is an SSD if it's <= 2TB
                    // 2. Other drives are HDDs
                    if (index === 0 && drive.size <= 2048) { // First drive and <= 2TB, likely SSD
                        // Convert to TB if size is large enough
                        if (drive.size >= 1000) {
                            var tb = (drive.size / 1000).toFixed(1);
                            return "SSD: ".concat(tb, "TB");
                        }
                        else {
                            return "SSD: ".concat(drive.size, "GB");
                        }
                    }
                    else {
                        // For other drives, format as HDD
                        if (drive.size >= 1000) {
                            var tb = (drive.size / 1000).toFixed(1);
                            return "HDD: ".concat(tb, "TB");
                        }
                        else {
                            return "HDD: ".concat(drive.size, "GB");
                        }
                    }
                });
                return formattedDrives.join(', ');
            }
            else {
                return 'No drives detected';
            }
        }
        else {
            // For Unix-like systems, use df command to get all mounted filesystems
            var result = (0, child_process_1.execSync)('df -h', { encoding: 'utf8' });
            var lines = result.split('\n');
            var drives = [];
            // Skip the header line and process each line
            for (var i = 1; i < lines.length; i++) {
                var line = ((_a = lines[i]) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                if (line !== '') {
                    var parts = line.split(/\s+/);
                    if (parts.length >= 6) {
                        // On some systems, the device name is in the first column, size in the second
                        var device = parts[0];
                        var size = parts[1];
                        var mountPoint = parts[5];
                        drives.push("".concat(device, " (").concat(size, ") on ").concat(mountPoint));
                    }
                }
            }
            return drives.length > 0 ? drives.join(', ') : 'No drives detected';
        }
    }
    catch (error) {
        console.error('Error getting disk info:', error.message);
        return 'Error collecting disk information';
    }
}
// Function to get hostname and username
function getSystemIdentifiers() {
    return {
        hostname: os.hostname(),
        username: os.userInfo().username
    };
}
// Function to get MAC address using system commands (fallback)
function getMacAddressFallback() {
    var _a;
    try {
        var macAddress = '';
        if (os.platform() === 'win32') {
            var result = (0, child_process_1.execSync)('getmac', { encoding: 'utf8' });
            var lines = result.split('\n');
            for (var _i = 0, lines_3 = lines; _i < lines_3.length; _i++) {
                var line = lines_3[_i];
                if (line.includes('Physical Address') || line.includes('---'))
                    continue;
                var parts = line.trim().split(/\s+/);
                if (parts.length >= 3 && ((_a = parts[0]) === null || _a === void 0 ? void 0 : _a.includes('-'))) {
                    macAddress = parts[0].replace(/-/g, ':');
                    break;
                }
            }
        }
        else {
            var result = (0, child_process_1.execSync)('ifconfig', { encoding: 'utf8' });
            var match = result.match(/([0-9a-f]{2}:){5}[0-9a-f]{2}/i);
            if (match) {
                macAddress = match[0];
            }
        }
        return macAddress;
    }
    catch (error) {
        console.error('Error getting MAC address:', error);
        return '';
    }
}
// Function to detect Office installation
function getOfficeInfo() {
    try {
        if (os.platform() === 'win32') {
            // Method 1: Use PowerShell with inline script for better performance
            try {
                console.log('Trying inline PowerShell script for Office detection...');
                // Inline PowerShell script that combines the functionality of Get-OfficeInfo.ps1
                var psScript = "\n        $results = @()\n        \n        function Get-UninstallItems($path) {\n          if (Test-Path $path) {\n            Get-ItemProperty \"$path\\*\" | ForEach-Object {\n              [PSCustomObject]@{\n                Source         = $path\n                DisplayName    = $_.DisplayName\n                DisplayVersion = $_.DisplayVersion\n                Publisher      = $_.Publisher\n              }\n            }\n          }\n        }\n        \n        # Search common uninstall locations\n        $results += Get-UninstallItems \"HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\"\n        $results += Get-UninstallItems \"HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\"\n        \n        # Filter Office-related rows and remove null DisplayName\n        $officeRows = $results | Where-Object { $_.DisplayName -and ($_.DisplayName -match 'Office|Microsoft 365|Microsoft Office|Visio|Project') } |\n                      Sort-Object DisplayName -Unique\n        \n        # Output only the essential information\n        if ($officeRows.Count -gt 0) {\n          # Output just the first Office entry\n          $firstOffice = $officeRows[0]\n          @{\n            DisplayName = $firstOffice.DisplayName\n            DisplayVersion = $firstOffice.DisplayVersion\n          } | ConvertTo-Json\n        }\n        ";
                var psCommand = "powershell -ExecutionPolicy Bypass -Command \"".concat(psScript.replace(/"/g, '""'), "\"");
                var result = (0, child_process_1.execSync)(psCommand, {
                    encoding: 'utf8',
                    stdio: 'pipe',
                    timeout: 15000, // 15 seconds timeout
                    windowsHide: true
                });
                if (result && result.trim() !== '') {
                    try {
                        var officeData = JSON.parse(result);
                        if (officeData.DisplayName) {
                            var displayName = officeData.DisplayName;
                            var version = officeData.DisplayVersion || '';
                            var result_1 = version ? "".concat(displayName, " ").concat(version) : displayName;
                            console.log("Found Office via inline PowerShell: ".concat(result_1));
                            return result_1;
                        }
                    }
                    catch (parseError) {
                        console.log('Error parsing PowerShell output:', parseError.message);
                        // Try alternative parsing method
                        var lines = result.split('\n');
                        var displayName = '';
                        var displayVersion = '';
                        for (var _i = 0, lines_4 = lines; _i < lines_4.length; _i++) {
                            var line = lines_4[_i];
                            var trimmedLine = line.trim();
                            if (trimmedLine.startsWith('DisplayName:')) {
                                displayName = trimmedLine.substring('DisplayName:'.length).trim();
                            }
                            else if (trimmedLine.startsWith('DisplayVersion:')) {
                                displayVersion = trimmedLine.substring('DisplayVersion:'.length).trim();
                            }
                        }
                        if (displayName) {
                            var result_2 = displayVersion ? "".concat(displayName, " ").concat(displayVersion) : displayName;
                            console.log("Found Office via alternative parsing: ".concat(result_2));
                            return result_2;
                        }
                    }
                }
            }
            catch (psError) {
                console.log('Inline PowerShell detection failed:', psError.message);
            }
            // Method 2: Fallback to registry query method
            try {
                console.log('Trying registry query method...');
                // Query both registry locations
                var registryPaths = [
                    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
                    'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
                ];
                var _loop_1 = function (registryPath) {
                    try {
                        console.log("Checking registry path: ".concat(registryPath));
                        // Get all subkeys under the uninstall path
                        var subKeysOutput = (0, child_process_1.execSync)("reg query \"".concat(registryPath, "\""), {
                            encoding: 'utf8',
                            stdio: 'pipe',
                            timeout: 10000
                        });
                        var lines = subKeysOutput.split('\n').filter(function (line) { return line.trim().startsWith(registryPath); });
                        console.log("Found ".concat(lines.length, " entries, filtering for Office..."));
                        // For each potential entry, check if it's Office-related
                        for (var _c = 0, lines_5 = lines; _c < lines_5.length; _c++) {
                            var line = lines_5[_c];
                            var subKey = line.trim();
                            try {
                                // First check if this might be an Office entry
                                if (subKey.toLowerCase().includes('office') || subKey.toLowerCase().includes('microsoft 365') || subKey.toLowerCase().includes('microsoft office')) {
                                    // Get DisplayName and DisplayVersion
                                    var detailsOutput = (0, child_process_1.execSync)("reg query \"".concat(subKey, "\" /v DisplayName /v DisplayVersion"), {
                                        encoding: 'utf8',
                                        stdio: 'pipe',
                                        timeout: 5000
                                    });
                                    // Parse the output to extract DisplayName and DisplayVersion
                                    var displayName = '';
                                    var displayVersion = '';
                                    var detailLines = detailsOutput.split('\n');
                                    for (var _d = 0, detailLines_1 = detailLines; _d < detailLines_1.length; _d++) {
                                        var detailLine = detailLines_1[_d];
                                        if (detailLine.includes('DisplayName')) {
                                            var match = detailLine.match(/REG_SZ\s+(.*)$/);
                                            if (match && match[1]) {
                                                displayName = match[1].trim();
                                            }
                                        }
                                        else if (detailLine.includes('DisplayVersion')) {
                                            var match = detailLine.match(/REG_SZ\s+(.*)$/);
                                            if (match && match[1]) {
                                                displayVersion = match[1].trim();
                                            }
                                        }
                                    }
                                    // If we found Office information, return it formatted properly
                                    if (displayName && (displayName.includes('Office') || displayName.includes('Microsoft 365') || displayName.includes('Microsoft Office'))) {
                                        console.log("Found Office in registry: ".concat(displayName));
                                        if (displayVersion) {
                                            var result = "".concat(displayName, " ").concat(displayVersion);
                                            console.log("Returning: ".concat(result));
                                            return { value: result };
                                        }
                                        else {
                                            console.log("Returning: ".concat(displayName));
                                            return { value: displayName };
                                        }
                                    }
                                }
                            }
                            catch (subKeyError) {
                                // Continue to next subkey
                                continue;
                            }
                        }
                    }
                    catch (registryError) {
                        console.log("Error querying registry path ".concat(registryPath, ": ").concat(registryError.message));
                        return "continue";
                    }
                };
                for (var _a = 0, registryPaths_1 = registryPaths; _a < registryPaths_1.length; _a++) {
                    var registryPath = registryPaths_1[_a];
                    var state_1 = _loop_1(registryPath);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
            }
            catch (registryMethodError) {
                console.log('Registry method failed:', registryMethodError.message);
            }
            // Method 3: Fallback to file system check
            console.log('Using file system fallback method...');
            var officePaths = [
                'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
                'C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE',
                'C:\\Program Files\\Microsoft Office\\Office15\\WINWORD.EXE',
                'C:\\Program Files (x86)\\Microsoft Office\\Office15\\WINWORD.EXE',
                'C:\\Program Files\\Microsoft Office\\Office14\\WINWORD.EXE',
                'C:\\Program Files (x86)\\Microsoft Office\\Office14\\WINWORD.EXE'
            ];
            for (var _b = 0, officePaths_1 = officePaths; _b < officePaths_1.length; _b++) {
                var path_1 = officePaths_1[_b];
                if (require('fs').existsSync(path_1)) {
                    console.log("Found Office installation at: ".concat(path_1));
                    // Extract version from path
                    if (path_1.includes('Office16')) {
                        return 'Microsoft Office 2016/2019/365';
                    }
                    else if (path_1.includes('Office15')) {
                        return 'Microsoft Office 2013';
                    }
                    else if (path_1.includes('Office14')) {
                        return 'Microsoft Office 2010';
                    }
                    else {
                        return 'Microsoft Office';
                    }
                }
            }
            return 'Office not detected';
        }
        else {
            // For non-Windows systems, check for common office suites
            try {
                // Check for LibreOffice
                var libreOfficeResult = (0, child_process_1.execSync)('which libreoffice', { encoding: 'utf8', stdio: 'ignore' });
                if (libreOfficeResult.trim() !== '') {
                    return 'LibreOffice';
                }
            }
            catch (error) {
                // LibreOffice not found
            }
            try {
                // Check for OpenOffice
                var openOfficeResult = (0, child_process_1.execSync)('which soffice', { encoding: 'utf8', stdio: 'ignore' });
                if (openOfficeResult.trim() !== '') {
                    return 'Apache OpenOffice';
                }
            }
            catch (error) {
                // OpenOffice not found
            }
            return 'Office not detected';
        }
    }
    catch (error) {
        console.error('Error detecting Office:', error.message);
        return 'Error detecting Office';
    }
}
function testAgentUpdate() {
    return __awaiter(this, void 0, void 0, function () {
        var loginResponse, errorData, loginData, token_1, networkInfo, osInfo, systemSpecs, identifiers, diskInfo, macAddress, officeInfo, agentData, agentResponse, errorData, agentDataResponse, handleTriggerUpdate, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    console.log('Testing agent update with real PC information...');
                    return [4 /*yield*/, (0, node_fetch_1.default)('http://localhost:3001/api/auth/login', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                email: 'adminit@localhost.com',
                                password: 'password'
                            })
                        })];
                case 1:
                    loginResponse = _a.sent();
                    if (!!loginResponse.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, loginResponse.json()];
                case 2:
                    errorData = _a.sent();
                    console.log('Login failed:', errorData);
                    return [2 /*return*/];
                case 3: return [4 /*yield*/, loginResponse.json()];
                case 4:
                    loginData = _a.sent();
                    token_1 = loginData.token;
                    console.log('Login successful!');
                    // Collect real system information
                    console.log('Collecting PC information...');
                    networkInfo = getNetworkInfo();
                    osInfo = getOSInfo();
                    systemSpecs = getSystemSpecs();
                    identifiers = getSystemIdentifiers();
                    diskInfo = getDiskInfo();
                    macAddress = networkInfo.mac;
                    if (!macAddress || macAddress === '00:00:00:00:00:00') {
                        console.log('Using fallback method to get MAC address...');
                        macAddress = getMacAddressFallback();
                    }
                    officeInfo = getOfficeInfo();
                    agentData = {
                        pcName: identifiers.hostname,
                        userName: identifiers.username,
                        ipAddress: networkInfo.ip,
                        cpu: systemSpecs.cpuModel,
                        ram: "".concat(systemSpecs.totalMemory, "GB"),
                        os: osInfo.full, // Use the formatted OS information
                        harddisk: diskInfo, // Now includes properly formatted SSD/HDD information
                        macAddress: macAddress,
                        office: officeInfo // Add Office information
                    };
                    console.log('Collected information:');
                    console.log(JSON.stringify(agentData, null, 2));
                    return [4 /*yield*/, (0, node_fetch_1.default)('http://localhost:3001/api/agent', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(token_1)
                            },
                            body: JSON.stringify(agentData)
                        })];
                case 5:
                    agentResponse = _a.sent();
                    if (!!agentResponse.ok) return [3 /*break*/, 7];
                    return [4 /*yield*/, agentResponse.text()];
                case 6:
                    errorData = _a.sent();
                    console.log('Agent submission failed:', errorData);
                    return [2 /*return*/];
                case 7: return [4 /*yield*/, agentResponse.json()];
                case 8:
                    agentDataResponse = _a.sent();
                    console.log('Agent data submission successful:');
                    console.log('PC ID:', agentDataResponse.id);
                    console.log('Custom Fields:', JSON.stringify(agentDataResponse.customFields, null, 2));
                    handleTriggerUpdate = function (agentId) { return __awaiter(_this, void 0, void 0, function () {
                        var updateResponse, errorData, updateData, error_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 5, , 6]);
                                    console.log("Triggering update for agent ".concat(agentId, "..."));
                                    // Update UI immediately to show updating status (simulated)
                                    console.log('Updating UI to show updating status...');
                                    return [4 /*yield*/, (0, node_fetch_1.default)("http://localhost:3001/api/agents/".concat(agentId, "/trigger-update"), {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': "Bearer ".concat(token_1)
                                            }
                                        })];
                                case 1:
                                    updateResponse = _a.sent();
                                    if (!!updateResponse.ok) return [3 /*break*/, 3];
                                    return [4 /*yield*/, updateResponse.text()];
                                case 2:
                                    errorData = _a.sent();
                                    console.log('Update trigger failed:', errorData);
                                    return [2 /*return*/];
                                case 3: return [4 /*yield*/, updateResponse.json()];
                                case 4:
                                    updateData = _a.sent();
                                    console.log('Update triggered successfully:', updateData.message);
                                    // Simulate update completion
                                    console.log('Simulating update completion...');
                                    setTimeout(function () {
                                        console.log('Update completed successfully!');
                                    }, 3000);
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_2 = _a.sent();
                                    console.error('Error triggering update:', error_2);
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); };
                    // Trigger the update for the newly created agent
                    return [4 /*yield*/, handleTriggerUpdate(agentDataResponse.id)];
                case 9:
                    // Trigger the update for the newly created agent
                    _a.sent();
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _a.sent();
                    console.error('Error testing agent update:', error_1);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
testAgentUpdate().catch(console.error);
