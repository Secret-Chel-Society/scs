"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Key, Shield, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

function ResetPasswordStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">Secure</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Reset
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">New</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Key className="h-5 w-5" />
          Password
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">Access</div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <Lock className="h-5 w-5" />
          Restored
        </div>
      </div>
    </div>
  )
}

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

        console.log("Reset password URL params:", {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          type,
          tokenHash: !!tokenHash,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative flex min-h-screen items-center justify-center">
          <div className="relative z-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <Card className="w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Processing</CardTitle>
                <CardDescription className="text-green-200">Validating your reset link...</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative flex min-h-screen items-center justify-center">
          <div className="relative z-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <Card className="w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Password Updated</CardTitle>
                <CardDescription className="text-green-200">
                  Your password has been successfully updated. You will be redirected to the login page shortly.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                    Go to Login
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error && !formData.password) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-rose-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative flex min-h-screen items-center justify-center">
          <div className="relative z-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <Card className="w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Password Reset</CardTitle>
                <CardDescription className="text-red-200">There was a problem with your reset link</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-400/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>

                <div className="text-center">
                  <p className="mb-4 text-white">Your reset link may be invalid or expired. Please request a new password reset.</p>
                  <Link href="/forgot-password">
                    <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white">
                      Request New Reset Link
                    </Button>
                  </Link>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/password-reset-help" className="text-sm text-red-200 hover:text-red-100 hover:underline">
                  Need help? Contact support
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
              Set New Password
            </h1>
            <p className="text-xl text-green-200 mb-8">
              Create a secure new password for your account
            </p>
          </div>

          {/* Reset Password Statistics */}
          <ResetPasswordStats />

          {/* Main Form */}
          <div className="flex justify-center animate-slide-up" style={{ animationDelay: "400ms" }}>
            <Card className="w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Reset Your Password</CardTitle>
                <CardDescription className="text-green-200">Enter your new password below</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your new password"
                        required
                        minLength={6}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-green-400 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/70 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm your new password"
                        required
                        minLength={6}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-green-400 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/70 hover:text-white"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-400/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-300">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/login" className="text-sm text-green-200 hover:text-green-100 hover:underline">
                  Back to Login
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
