"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function PasswordResetHelpPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError("Email is required")
      return
    }

    setIsSubmitting(true)

    try {
      // Here you would typically send this to your backend to notify admins
      // For now, we'll just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setIsSuccess(true)

      toast({
        title: "Request submitted",
        description: "An admin has been notified and will help reset your password.",
      })
    } catch (error: any) {
      console.error("Error submitting request:", error)
      setError(error.message || "Failed to submit request. Please try again.")

      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="mt-4">Request Submitted</CardTitle>
            <CardDescription>
              An admin has been notified about your password reset issue for {email}. They will help you reset your
              password as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/">
              <Button>Return to Home</Button>
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
            <HelpCircle className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-center">Password Reset Help</CardTitle>
          <CardDescription className="text-center">
            Having trouble resetting your password? We can help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 text-sm">
            <p className="mb-2">
              We're currently experiencing some technical issues with our password reset system. If you're seeing an
              "Invalid Reset Link" error, please submit your email below and an admin will help reset your password
              manually.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Request Admin Help"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
            Try standard password reset again
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
