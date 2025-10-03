'use client'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLogin } from "@/hooks/useApi"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useTranslation } from "@/hooks/use-translation"
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle } from "lucide-react"
import logger from '@/lib/logger'

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  
  const loginMutation = useLogin()
  const router = useRouter()
  const { t } = useTranslation()

  // Load saved email from localStorage if available
  useEffect(() => {
    const savedEmail = localStorage.getItem("login-email")
    const savedRememberMe = localStorage.getItem("login-remember-me") === "true"
    
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
    
    // Focus email input on load
    if (emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [])

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle input validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    
    if (value && !validateEmail(value)) {
      setEmailError(t('auth.login.invalidEmail') || 'Please enter a valid email address')
    } else {
      setEmailError("")
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    
    if (value.length > 0 && value.length < 6) {
      setPasswordError(t('auth.login.passwordTooShort') || 'Password must be at least 6 characters')
    } else {
      setPasswordError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setEmailError("")
    setPasswordError("")
    
    // Validate inputs
    let hasError = false
    
    if (!email) {
      setEmailError(t('auth.login.emailRequired') || 'Email is required')
      if (emailInputRef.current) emailInputRef.current.focus()
      hasError = true
    } else if (!validateEmail(email)) {
      setEmailError(t('auth.login.invalidEmail') || 'Please enter a valid email address')
      if (emailInputRef.current) emailInputRef.current.focus()
      hasError = true
    }
    
    if (!password) {
      setPasswordError(t('auth.login.passwordRequired') || 'Password is required')
      if (!emailError && passwordInputRef.current) passwordInputRef.current.focus()
      hasError = true
    } else if (password.length < 6) {
      setPasswordError(t('auth.login.passwordTooShort') || 'Password must be at least 6 characters')
      if (!emailError && passwordInputRef.current) passwordInputRef.current.focus()
      hasError = true
    }
    
    if (hasError) return
    
    setIsLoading(true)
    
    try {
      const response = await loginMutation.login({ email, password })
      
      // Save email to localStorage if "Remember me" is checked
      if (rememberMe) {
        localStorage.setItem("login-email", email)
        localStorage.setItem("login-remember-me", "true")
      } else {
        localStorage.removeItem("login-email")
        localStorage.removeItem("login-remember-me")
      }
      
      // Ensure token is properly set before redirecting
      if (response?.token) {
        // Add a small delay to ensure the token is set in localStorage
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      }
      
      toast.success(t('auth.login.success') || 'Logged in successfully')
    } catch (error: any) {
      logger.error('Login error:', error)
      let message = t('auth.login.error') || 'Invalid email or password'
      
      // Provide more specific error messages based on status codes
      if (error?.status === 401) {
        message = t('auth.login.error') || 'Invalid email or password'
      } else if (error?.status === 429) {
        message = t('auth.login.tooManyAttempts') || 'Too many login attempts. Please try again later.'
      } else if (error?.message) {
        message = error.message
      }
      
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key for form navigation
  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !emailError && email) {
      e.preventDefault()
      passwordInputRef.current?.focus()
    }
  }

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !passwordError && password) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="items-center justify-center from-blue-50 via-indigo-50 to-purple-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zMCAyOGMwLTEuMS45LTIgMi0yaDE2YzEuMSAwIDItLjkgMi0yVjEyYzAtMS4xLS45LTItMi0yaC0xNmMtMS4xIDAtMiAuOS0yIDJ2MTR6IiBzdHJva2U9IiNlMWU3ZWQiIHN0cm9rZS13aWR0aD0iMSIvPjwvZz48L3N2Zz4=')] opacity-20 dark:opacity-10"></div>
      
      <Card className="w-full max-w-md shadow-3xl rounded-3xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <CardHeader className="space-y-1 text-center pt-8 pb-2">
          <div className="mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 border-0 rounded-xl w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('auth.login.title') || 'IT Asset Management System'}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {t('auth.login.description') || 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                {t('auth.email')}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  ref={emailInputRef}
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  onKeyDown={handleEmailKeyDown}
                  required
                  className={`pl-10 py-6 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                    emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  disabled={isLoading}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                />
                {emailError && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {emailError && (
                <p id="email-error" className="text-sm text-red-500 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {emailError}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                {t('auth.login.password')}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  ref={passwordInputRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyDown={handlePasswordKeyDown}
                  required
                  className={`pl-10 pr-10 py-6 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white ${
                    passwordError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  disabled={isLoading}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </Button>
                {passwordError && (
                  <div className="absolute inset-y-0 right-10 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {passwordError && (
                <p id="password-error" className="text-sm text-red-500 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {passwordError}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm text-gray-700 dark:text-gray-300">
                  {t('auth.login.rememberMe')}
                </Label>
              </div>
              
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              disabled={isLoading || !!emailError || !!passwordError}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('auth.login.signingIn') || "Signing in..."}
                </div>
              ) : (
                t('auth.login.signIn') || "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}