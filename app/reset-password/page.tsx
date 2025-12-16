"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"
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
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <CardTitle>Processing</CardTitle>
            <CardDescription>Validating your reset link...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="mt-4">Password Updated</CardTitle>
            <CardDescription>
              Your password has been successfully updated. You will be redirected to the login page shortly.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error && !formData.password) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Password Reset</CardTitle>
            <CardDescription>There was a problem with your reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="text-center">
              <p className="mb-4">Your reset link may be invalid or expired. Please request a new password reset.</p>
              <Link href="/forgot-password">
                <Button>Request New Reset Link</Button>
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/password-reset-help" className="text-sm text-muted-foreground hover:text-foreground">
              Need help? Contact support
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your new password"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your new password"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
