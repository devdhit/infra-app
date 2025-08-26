// Define our supported languages
export type Language = 'en' | 'zh-tw'
export const supportedLanguages: Language[] = ['en', 'zh-tw']

// Default language
export const defaultLanguage: Language = 'en'

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.assets': 'Assets',
    'nav.pc': 'PC',
    'nav.laptop': 'Laptop',
    'nav.printer': 'Printer',
    'nav.license': 'License',
    'nav.warehouse': 'Warehouse',
    'nav.settings': 'Settings',
    'nav.users': 'Users',
    'nav.tenants': 'Tenants',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.search.placeholder': 'Search assets...',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.actions': 'Actions',
    'common.list': 'List',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome to IT Asset Management System',
    'dashboard.totalAssets': 'Total Assets',
    'dashboard.activeAssets': 'Active Assets',
    'dashboard.maintenanceAssets': 'Maintenance Assets',
    'dashboard.retiredAssets': 'Retired Assets',
    
    // Auth
    'auth.login': 'Login',
    'auth.login.title': 'IT Asset Management System',
    'auth.login.description': 'Sign in to your account',
    'auth.login.success': 'Logged in successfully',
    'auth.login.error': 'Invalid email or password',
    'auth.login.signingIn': 'Signing in...',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.rememberMe': 'Remember me',
    'auth.forgotPassword': 'Forgot password?',
    'auth.logout.success': 'Logged out successfully',
    'auth.logout.error': 'Failed to logout',
    
    // Assets
    'assets.pc.title': 'PC Assets',
    'assets.laptop.title': 'Laptop Assets',
    'assets.printer.title': 'Printer Assets',
    'assets.license.title': 'License Assets',
    'assets.warehouse.title': 'Warehouse Assets',
    'assets.list.description': 'Manage your {0} assets',
    'assets.list.empty': 'No assets found',
    'assets.create.success': '{0} created successfully',
    'assets.delete.success': '{0} deleted successfully',
    'assets.delete.error': 'Failed to delete {0}',
    'assets.status.all': 'All Statuses',
    'assets.status.active': 'Active',
    'assets.status.inactive': 'Inactive',
    'assets.status.maintenance': 'Maintenance',
    'assets.status.retired': 'Retired',
    
    // Forms
    'forms.required': 'This field is required',
    'forms.invalidEmail': 'Please enter a valid email',
  },
  'zh-tw': {
    // Navigation
    'nav.dashboard': '儀表板',
    'nav.assets': '資產',
    'nav.pc': '電腦',
    'nav.laptop': '筆電',
    'nav.printer': '印表機',
    'nav.license': '授權',
    'nav.warehouse': '倉儲',
    'nav.settings': '設定',
    'nav.users': '使用者',
    'nav.tenants': '租戶',
    
    // Common
    'common.save': '儲存',
    'common.cancel': '取消',
    'common.edit': '編輯',
    'common.delete': '刪除',
    'common.create': '新增',
    'common.search': '搜尋',
    'common.search.placeholder': '搜尋資產...',
    'common.filter': '篩選',
    'common.export': '匯出',
    'common.import': '匯入',
    'common.actions': '操作',
    'common.list': '列表',
    
    // Dashboard
    'dashboard.title': '儀表板',
    'dashboard.welcome': '歡迎使用 IT 資產管理系統',
    'dashboard.totalAssets': '總資產數',
    'dashboard.activeAssets': '使用中資產',
    'dashboard.maintenanceAssets': '維護中資產',
    'dashboard.retiredAssets': '已報廢資產',
    
    // Auth
    'auth.login': '登入',
    'auth.login.title': 'IT 資產管理系統',
    'auth.login.description': '請登入您的帳戶',
    'auth.login.success': '登入成功',
    'auth.login.error': '電子郵件或密碼錯誤',
    'auth.login.signingIn': '登入中...',
    'auth.logout': '登出',
    'auth.email': '電子郵件',
    'auth.password': '密碼',
    'auth.rememberMe': '記住我',
    'auth.forgotPassword': '忘記密碼？',
    'auth.logout.success': '成功登出',
    'auth.logout.error': '登出失敗',
    
    // Assets
    'assets.pc.title': '電腦資產',
    'assets.laptop.title': '筆電資產',
    'assets.printer.title': '印表機資產',
    'assets.license.title': '授權資產',
    'assets.warehouse.title': '倉儲資產',
    'assets.list.description': '管理您的{0}資產',
    'assets.list.empty': '未找到資產',
    'assets.create.success': '{0}新增成功',
    'assets.delete.success': '{0}刪除成功',
    'assets.delete.error': '{0}刪除失敗',
    'assets.status.all': '所有狀態',
    'assets.status.active': '使用中',
    'assets.status.inactive': '未使用',
    'assets.status.maintenance': '維護中',
    'assets.status.retired': '已報廢',
    
    // Forms
    'forms.required': '此欄位為必填',
    'forms.invalidEmail': '請輸入有效的電子郵件',
  }
}

// Get translation for a key with optional parameters
export function t(key: string, ...params: (string | number)[]): string {
  // This function is meant to be used in client components
  // For server components, use getTranslations and then access the key directly
  return key
}

// Get all translations for a language
export function getTranslations(lang?: Language): Record<string, string> {
  const currentLang = lang || defaultLanguage
  return translations[currentLang]
}