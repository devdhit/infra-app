import { useTheme as useNextTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get the current effective theme (resolved theme)
  const resolvedTheme = mounted ? (theme === 'system' ? systemTheme : theme) : null

  // Check if current theme is dark
  const isDark = resolvedTheme === 'dark'

  // Check if current theme is light
  const isLight = resolvedTheme === 'light'

  return {
    theme: resolvedTheme,
    setTheme,
    isDark,
    isLight,
    mounted
  }
}