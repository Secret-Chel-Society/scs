"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DirectVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No verification token provided")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/direct-verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to verify email")
        }

        setIsVerified(true)
        setEmail(data.email)
      } catch (error) {
        console.error("Error verifying token:", error)
        setError(error instanceof Error ? error.message : "An error occurred during verification")
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      verifyToken()
    } else {
      setIsLoading(false)
      setError("No verification token provided")
    }
  }, [token])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Verifying Your Email</CardTitle>
              <CardDescription>Please wait while we verify your email address</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">This may take a few moments...</p>
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
              <CardDescription>We encountered an error while verifying your email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <p className="text-center text-muted-foreground">
                  Please try again or request a new verification email.
                </p>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                  <Button asChild variant="outline">
                    <Link href="/resend-verification">Resend Verification</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/login">Go to Login</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
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
            <CardTitle>Email Verified</CardTitle>
            <CardDescription>Your email address has been successfully verified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h3 className="text-xl font-semibold">Verification Successful</h3>
              {email && <p className="text-center text-muted-foreground">Your account ({email}) has been verified.</p>}
              <p className="text-center text-muted-foreground">You can now log in to access your account.</p>
              <Button asChild className="mt-4">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
