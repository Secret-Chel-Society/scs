"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Key, Shield, RefreshCw, ArrowLeft, Lock, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    async function validateToken() {
      try {
        // Check for different possible parameter formats
        const accessToken = searchParams.get("access_token")
        const refreshToken = searchParams.get("refresh_token")
        const type = searchParams.get("type")
        const tokenHash = searchParams.get("token_hash")
        const code = searchParams.get("code")

        console.log("Reset password URL params:", {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          type,
          tokenHash: !!tokenHash,
          code: !!code,
          allParams: Object.fromEntries(searchParams.entries()),
        })

        // If we have access_token and refresh_token, use them directly
        if (accessToken && refreshToken && type === "recovery") {
          console.log("Found access/refresh tokens, setting session")

          const supabase = createClient()
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error("Error setting session:", error)
            setError("Invalid or expired reset link")
            setIsLoading(false)
            return
          }

          console.log("Session set successfully, user can reset password")
          setIsLoading(false)
          return
        }

        // If we have a code parameter, handle it as a password reset token
        if (code) {
          console.log("Found code parameter, handling as password reset token")
          console.log("Code value:", code)
          console.log("Current URL:", window.location.href)

          const supabase = createClient()
          
          try {
            // For password reset, we need to use the code to get a session
            // The code from Supabase password reset emails is typically used differently
            
            // First, try to get the current session to see if we're already authenticated
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError) {
              console.error("Error getting session:", sessionError)
            }
            
            if (session) {
              console.log("User already has a session, can reset password")
              setIsLoading(false)
              return
            }
            
            // If no session, try to use the code to authenticate
            // The code from Supabase password reset emails is a PKCE code
            console.log("No existing session, trying to use code for authentication...")
            
            // Try to exchange the code for a session
            const { data: sessionData, error: codeExchangeError } = await supabase.auth.exchangeCodeForSession(code)
            
            if (codeExchangeError) {
              console.error("Code exchange failed:", codeExchangeError)
              console.error("Error details:", JSON.stringify(codeExchangeError, null, 2))
              
              // Check if it's an expired link
              if (codeExchangeError.message.includes("expired") || codeExchangeError.message.includes("invalid")) {
                setError(`Your reset link has expired. Password reset links are only valid for 1 hour. Please request a new password reset.`)
              } else {
                setError(`Invalid reset link: ${codeExchangeError.message}. Please request a new password reset.`)
              }
              setIsLoading(false)
              return
            } else {
              console.log("Code exchange successful!")
              console.log("Session data:", sessionData)
              setIsLoading(false)
              return
            }
          } catch (exchangeError) {
            console.error("Unexpected error during code handling:", exchangeError)
            setError(`Unexpected error: ${exchangeError instanceof Error ? exchangeError.message : 'Unknown error'}`)
            setIsLoading(false)
            return
          }
        }

        // If we have a token_hash, try to verify the OTP
        if (tokenHash && type === "recovery") {
          console.log("Found token_hash, attempting to verify OTP")

          const supabase = createClient()
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          })

          if (error) {
            console.error("Error verifying OTP:", error)
            setError("Invalid or expired reset link")
            setIsLoading(false)
            return
          }

          console.log("OTP verified successfully, user can reset password")
          setIsLoading(false)
          return
        }

        // If no valid tokens found, redirect to help
        console.log("No valid reset tokens found, redirecting to help")
        router.push("/password-reset-help")
      } catch (error) {
        console.error("Error validating token:", error)
        setError("An error occurred while processing your reset link")
        setIsLoading(false)
      }
    }

    validateToken()
  }, [router, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      })

      if (error) {
        console.error("Error updating password:", error)
        setError(error.message)
        return
      }

      setIsSuccess(true)
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      })

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      console.error("Error updating password:", error)
      setError("An error occurred while updating your password")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        {/* Enhanced Hero Header Section */}
        <div className="relative overflow-hidden py-20 px-4">
          <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full animate-float"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-assist-green-500/20 to-goal-red-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-hockey-silver-500/20 to-ice-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-2xl shadow-ice-blue-500/30">
                <Loader2 className="h-16 w-16 text-white animate-spin" />
              </div>
            </div>
            
            <h1 className="hockey-title mb-4">
              Processing
            </h1>
            <p className="hockey-subtitle mb-8">
              Validating your reset link...
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
          <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="p-6 bg-gradient-to-r from-ice-blue-100/30 to-rink-blue-100/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-xl border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <RefreshCw className="mx-auto h-12 w-12 text-ice-blue-600 dark:text-ice-blue-400 mb-4 animate-spin" />
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    Please wait while we validate your password reset link...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        {/* Enhanced Hero Header Section */}
        <div className="relative overflow-hidden py-20 px-4">
          <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full animate-float"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-assist-green-500/20 to-goal-red-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-hockey-silver-500/20 to-ice-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-full shadow-2xl shadow-assist-green-500/30">
                <CheckCircle2 className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <h1 className="hockey-title mb-4">
              Password Updated
            </h1>
            <p className="hockey-subtitle mb-8">
              Your password has been successfully updated. You will be redirected to the login page shortly.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
          <Card className="hockey-card hockey-card-hover border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="p-6 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-xl border border-assist-green-200/30 dark:border-assist-green-700/30">
                  <Lock className="mx-auto h-12 w-12 text-assist-green-600 dark:text-assist-green-400 mb-4" />
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    Your account is now secure with your new password. You can now log in with your updated credentials.
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Link href="/login">
                    <Button className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Go to Login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !formData.password) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        {/* Enhanced Hero Header Section */}
        <div className="relative overflow-hidden py-20 px-4">
          <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full animate-float"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-assist-green-500/20 to-goal-red-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-hockey-silver-500/20 to-ice-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-full shadow-2xl shadow-goal-red-500/30">
                <AlertCircle className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <h1 className="hockey-title mb-4">
              Password Reset Error
            </h1>
            <p className="hockey-subtitle mb-8">
              There was a problem with your reset link
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
          <Card className="hockey-card hockey-card-hover border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-8 pb-8">
              <div className="space-y-6">
                <Alert variant="destructive" className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
                  <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                  <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">{error}</AlertDescription>
                </Alert>

                <div className="text-center space-y-4">
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    Your reset link may be invalid or expired. Please request a new password reset.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/forgot-password">
                      <Button className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Request New Reset Link
                      </Button>
                    </Link>
                    
                    <Link href="/password-reset-help">
                      <Button variant="outline" className="hockey-button border-ice-blue-200/50 dark:border-rink-blue-700/50 text-ice-blue-600 dark:text-ice-blue-400 hover:bg-ice-blue-50 dark:hover:bg-ice-blue-900/20 hover:scale-105 transition-all duration-300">
                        <Shield className="mr-2 h-4 w-4" />
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="mt-4 p-4 bg-ice-blue-50 dark:bg-ice-blue-900/20 rounded-lg border border-ice-blue-200 dark:border-ice-blue-700">
                    <p className="text-sm text-ice-blue-700 dark:text-ice-blue-300">
                      <strong>Tip:</strong> Password reset links expire after 1 hour for security. If you need to reset your password, please request a new link.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full animate-float"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-assist-green-500/20 to-goal-red-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-hockey-silver-500/20 to-ice-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-2xl shadow-ice-blue-500/30">
              <Key className="h-16 w-16 text-white" />
            </div>
          </div>
          
          <h1 className="hockey-title mb-4">
            Reset Your Password
          </h1>
          <p className="hockey-subtitle mb-8">
            Enter your new password below
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
        <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
              <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              Create New Password
            </CardTitle>
            <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Choose a strong password for your account</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your new password"
                    className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500 pr-12"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-ice-blue-600 dark:text-ice-blue-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your new password"
                    className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500 pr-12"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-ice-blue-600 dark:text-ice-blue-400"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
                  <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                  <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pt-6">
            <div className="flex justify-center w-full">
              <Link href="/login">
                <Button variant="outline" className="hockey-button border-ice-blue-200/50 dark:border-rink-blue-700/50 text-ice-blue-600 dark:text-ice-blue-400 hover:bg-ice-blue-50 dark:hover:bg-ice-blue-900/20 hover:scale-105 transition-all duration-300">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
