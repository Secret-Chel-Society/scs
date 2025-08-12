"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useSupabase } from "@/lib/supabase/client"
import Link from "next/link"

export default function ShortVerifyPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const validateToken = async () => {
      try {
        // Validate the token
        const response = await fetch(`/api/short-verify?token=${params.token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Invalid verification link")
        }

        setEmail(data.email)
      } catch (error: any) {
        console.error("Error validating token:", error)
        setError(error.message || "Failed to validate verification link")
      } finally {
        setIsLoading(false)
      }
    }

    validateToken()
  }, [params.token])

  const handleVerify = async () => {
    if (!email || !supabase) return

    setIsVerifying(true)
    setError(null)

    try {
      // Try to manually verify the user through our API
      const response = await fetch("/api/direct-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify account")
      }

      setSuccess(true)
    } catch (error: any) {
      console.error("Error verifying account:", error)
      setError(error.message || "Failed to verify your account")
    } finally {
      setIsVerifying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Verifying Link</CardTitle>
              <CardDescription>Please wait while we validate your verification link</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-center">Validating your verification link...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Verification Failed</CardTitle>
              <CardDescription>There was a problem with your verification link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <p className="text-center text-muted-foreground">
                Please try verifying your account using one of our alternative methods.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild>
                <Link href="/verify-account">Try Alternative Verification</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Account Verified</CardTitle>
              <CardDescription>Your account has been successfully verified</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h3 className="text-xl font-semibold">Verification Successful</h3>
              <p className="text-center text-muted-foreground">
                Your account has been verified. You can now log in to access your account.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild>
                <Link href="/login">Go to Login</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verify Your Account</CardTitle>
            <CardDescription>Complete your account verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center">
              Click the button below to verify your account for <strong>{email}</strong>.
            </p>
            <div className="flex justify-center pt-4">
              <Button onClick={handleVerify} disabled={isVerifying}>
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify My Account"
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Having trouble?{" "}
              <Link href="/verify-account" className="text-primary hover:underline">
                Try alternative verification methods
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
