'use client'

import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"

export default function I18nTestPage() {
  const { t, language, setLanguage } = useTranslation()
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">I18n Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Current Language: {language}</h2>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Translations:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dashboard: {t('nav.dashboard')}</li>
            <li>Assets: {t('nav.assets')}</li>
            <li>Users: {t('nav.users')}</li>
            <li>Login: {t('auth.login')}</li>
            <li>Parameterized: {t('assets.create.success', 'PC')}</li>
          </ul>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setLanguage('en')}>
            Switch to English
          </Button>
          <Button onClick={() => setLanguage('zh-tw')}>
            切换到繁体中文
          </Button>
        </div>
      </div>
    </div>
  )
}