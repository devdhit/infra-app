'use client'

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const loginMutation = useLogin();
  const router = useRouter();
  const { t } = useTranslation();

  // Load saved email from localStorage if available
  useEffect(() => {
    const savedEmail = localStorage.getItem("login-email");
    const savedRememberMe = localStorage.getItem("login-remember-me") === "true";
    
    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await loginMutation.mutateAsync({ email, password });
      
      // Save email to localStorage if "Remember me" is checked
      if (rememberMe) {
        localStorage.setItem("login-email", email);
        localStorage.setItem("login-remember-me", "true");
      } else {
        localStorage.removeItem("login-email");
        localStorage.removeItem("login-remember-me");
      }
      
      router.push('/dashboard');
      toast.success(t('auth.login.success') || 'Logged in successfully');
    } catch (error: any) {
      console.error('Login error:', error);
      let message = t('auth.login.error') || 'Invalid email or password';
      
      // Provide more specific error messages based on status codes
      if (error?.status === 401) {
        message = t('auth.login.error') || 'Invalid email or password';
      } else if (error?.status === 429) {
        message = t('auth.login.tooManyAttempts') || 'Too many login attempts. Please try again later.';
      } else if (error?.message) {
        message = error.message;
      }
      
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-gray-500" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('auth.login.title') || 'IT Asset Management System'}
          </CardTitle>
          <CardDescription>
            {t('auth.login.description') || 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm">
                  {t('auth.rememberMe')}
                </Label>
              </div>
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm"
                type="button"
                disabled={isLoading}
              >
                {t('auth.forgotPassword')}
              </Button>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (t('auth.login.signingIn') || "Signing in...") : t('auth.login_a')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-500">
            {t('auth.login.footer') || 'Need help? Contact your system administrator'}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}