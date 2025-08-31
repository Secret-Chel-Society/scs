"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, Mail, Key, Shield, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

function ForgotPasswordStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-orange-200 mb-2">Reset</div>
        <div className="text-orange-300 flex items-center justify-center gap-2">
          <Key className="h-5 w-5" />
          Password
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">Secure</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Process
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">Quick</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <Clock className="h-5 w-5" />
          Recovery
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!email) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    try {
      console.log("Sending password reset request for:", email)

      const response = await fetch("/api/auth/reset-password-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email")
      }

      console.log("Password reset email sent successfully")
      setIsSuccess(true)
    } catch (error) {
      console.error("Error sending password reset email:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative flex min-h-screen items-center justify-center">
          <div className="relative z-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <Card className="w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Check Your Email</CardTitle>
                <CardDescription className="text-green-200">
                  We've sent a password reset link to <strong className="text-white">{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 p-4">
                  <Mail className="mx-auto h-8 w-8 text-blue-400 mb-2" />
                  <p className="text-sm text-blue-200">
                    Click the link in your email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
                <p className="mt-4 text-sm text-orange-200">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => {
                      setIsSuccess(false)
                      setEmail("")
                    }}
                    className="text-orange-300 hover:text-orange-200 hover:underline font-medium"
                  >
                    try again
                  </button>
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/login" className="text-sm text-orange-200 hover:text-orange-100 hover:underline">
                  Back to Login
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-orange-200 to-red-200 bg-clip-text text-transparent">
              Reset Password
            </h1>
            <p className="text-xl text-orange-200 mb-8">
              Enter your email and we'll send you a secure reset link
            </p>
          </div>

          {/* Forgot Password Statistics */}
          <ForgotPasswordStats />

          {/* Main Form */}
          <div className="flex justify-center animate-slide-up" style={{ animationDelay: "400ms" }}>
            <Card className="w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Forgot Password</CardTitle>
                <CardDescription className="text-orange-200">
                  Enter your email address and we'll send you a link to reset your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-orange-400"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-400/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-300">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/login" className="text-sm text-orange-200 hover:text-orange-100 hover:underline">
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
