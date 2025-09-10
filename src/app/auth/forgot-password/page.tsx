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
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Mail } from "lucide-react";
import logger from '@/lib/logger';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call an API to send a reset email
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setIsSubmitted(true);
      toast.success(t('auth.forgotPassword.success') || 'Password reset instructions sent to your email');
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      let message = t('auth.forgotPassword.error') || 'Failed to send password reset instructions';
      if (error?.message) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-gray-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('auth.forgotPassword.checkEmail') || 'Check Your Email'}
            </CardTitle>
            <CardDescription>
              {t('auth.forgotPassword.instructionsSent') || 'We have sent password reset instructions to your email.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              {t('auth.forgotPassword.notReceived') || "Didn't receive the email? Check your spam folder or"}
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm ml-1"
                onClick={() => setIsSubmitted(false)}
              >
                {t('auth.forgotPassword.tryAgain') || 'try again'}
              </Button>
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/auth/login" className="w-full">
              <Button variant="outline" className="w-full">
                {t('auth.login_a') || 'Back to Login'}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-gray-500" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('auth.forgotPassword.title') || 'Forgot Password?'}
          </CardTitle>
          <CardDescription>
            {t('auth.forgotPassword.description') || 'Enter your email address and we will send you instructions to reset your password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (t('auth.forgotPassword.sending') || "Sending...") : (t('auth.forgotPassword.sendInstructions') || "Send Instructions")}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full">
              {t('auth.login_a') || 'Back to Login'}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}