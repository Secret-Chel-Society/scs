"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function StandardResetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(false)

  // Check for token and establish session
  useEffect(() => {
    async function checkSession() {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClientComponentClient()

        // First, check if we already have a session
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData.session) {
          console.log("User already has a valid session")
          setHasSession(true)
          setIsLoading(false)
          return
        }

        // Get URL parameters
        const tokenHash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (tokenHash && type === "recovery") {
          try {
            console.log("Verifying token_hash...")

            const { error } = await supabase.auth.verifyOtp({
              type: "recovery",
              token_hash: tokenHash,
            })

            if (error) {
              console.error("Error verifying token_hash:", error)
              throw error
            }

            // Check if we have a session now
            const { data: newSessionData } = await supabase.auth.getSession()

            if (newSessionData.session) {
              console.log("Session established after verifying token_hash")
              setHasSession(true)
            } else {
              console.error("No session after verifying token_hash")
              throw new Error("Failed to establish session after verifying token")
            }
          } catch (error: any) {
            console.error("Error processing token_hash:", error)
            throw error
          }
        } else {
          throw new Error("No valid reset token found in URL. Please request a new password reset link.")
        }
      } catch (error: any) {
        console.error("Error in authentication flow:", error)
        setError(error.message || "Invalid or expired token. Please request a new password reset link.")
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [searchParams])

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate passwords
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Attempting to update password...")
      const supabase = createClientComponentClient()

      // Get current session to verify we're authenticated
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (!sessionData.session) {
        throw new Error("No active session. Please try again with a new reset link.")
      }

      console.log("Session verified, updating password...")

      // Update the password
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        throw error
      }

      console.log("Password updated successfully")
      setIsSuccess(true)

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: any) {
      console.error("Error updating password:", error)
      setError(error.message || "Failed to update password. Please try again.")

      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      })
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
            <CardTitle>Verifying Reset Link</CardTitle>
            <CardDescription>Please wait while we verify your reset link.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error && !hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">Invalid Reset Link</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/forgot-password">
              <Button>Request New Reset Link</Button>
            </Link>
          </CardFooter>
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
              Your password has been successfully updated. You will be redirected to the login page.
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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <KeyRound className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                "Reset Password"
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
