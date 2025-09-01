"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function ResendVerificationPage() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get("email") || ""
  const [email, setEmail] = useState(initialEmail)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error" | "not_registered">("idle")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      // First check if the user exists
      const checkResponse = await fetch("/api/auth/check-user-exists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        throw new Error(checkData.error || "Failed to check user status")
      }

      // If user doesn't exist, show registration message
      if (!checkData.exists) {
        setStatus("not_registered")
        setMessage("This email address is not registered. Please register first.")
        setIsLoading(false)
        return
      }

      // If user exists, send verification email
      console.log("Sending verification email to:", email)
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      // Log the raw response for debugging
      console.log("Response status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        console.log("Primary verification method failed, trying fallback...")

        // Try fallback method
        const fallbackResponse = await fetch("/api/auth/fallback-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        })

        const fallbackData = await fallbackResponse.json()

        if (!fallbackResponse.ok) {
          throw new Error(fallbackData.error || "Failed to send verification email")
        }

        setStatus("success")
        setMessage("Verification email sent successfully! Please check your inbox and spam folder.")

        toast({
          title: "Email sent (fallback method)",
          description: "Please check your inbox and spam folder for the verification email",
        })

        return
      }

      if (data.simulated) {
        setStatus("success")
        setMessage(
          `Verification email sent successfully! ${data.verificationUrl ? `\n\nDirect link (for testing): ${data.verificationUrl}` : ""}`,
        )
      } else {
        setStatus("success")
        setMessage(data.message || "Verification email sent successfully! Please check your inbox and spam folder.")
      }

      // Log success for debugging
      console.log("Verification email sent successfully to:", email)
      if (data.verificationUrl) {
        console.log("Verification URL:", data.verificationUrl)
      }

      toast({
        title: "Email sent",
        description: "Please check your inbox and spam folder for the verification email",
      })
    } catch (error) {
      console.error("Error sending verification email:", error)
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Failed to send verification email")

      toast({
        title: "Failed to send email",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Resend Verification Email</CardTitle>
          <CardDescription>Enter your email address to receive a new verification link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResendVerification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Verification Email"
              )}
            </Button>
          </form>

          {status === "success" && (
            <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Email Sent!</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "not_registered" && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900 dark:text-blue-300">
              <Info className="h-4 w-4" />
              <AlertTitle>Not Registered</AlertTitle>
              <AlertDescription>
                {message}{" "}
                <Link href="/register" className="font-medium underline">
                  Register here
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {process.env.NODE_ENV === "development" && status === "success" && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Debug Information (Development Only)</h4>
              <p className="text-xs text-gray-600">Check the browser console for verification URL details.</p>
              <button
                type="button"
                onClick={() => {
                  fetch(`/api/debug/verification-token?email=${encodeURIComponent(email)}`)
                    .then((res) => res.json())
                    .then((data) => console.log("Recent tokens for email:", data))
                    .catch((err) => console.error("Debug fetch error:", err))
                }}
                className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
              >
                Debug Recent Tokens
              </button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already verified?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Go to Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
