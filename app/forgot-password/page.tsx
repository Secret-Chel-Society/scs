"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, Mail, Shield, Key, RefreshCw, ArrowLeft, Globe } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

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
              Check Your Email
            </h1>
            <p className="hockey-subtitle mb-8">
              We've sent a password reset link to <strong className="text-ice-blue-600 dark:text-ice-blue-400">{email}</strong>
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
          <Card className="hockey-card hockey-card-hover border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="p-6 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-xl border border-assist-green-200/30 dark:border-assist-green-700/30">
                  <Mail className="mx-auto h-12 w-12 text-assist-green-600 dark:text-assist-green-400 mb-4" />
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    Click the link in your email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <p className="text-hockey-silver-600 dark:text-hockey-silver-400">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button
                      onClick={() => {
                        setIsSuccess(false)
                        setEmail("")
                      }}
                      className="text-ice-blue-600 dark:text-ice-blue-400 hover:text-ice-blue-700 dark:hover:text-ice-blue-300 font-medium hover:underline transition-colors duration-200"
                    >
                      try again
                    </button>
                  </p>
                  
                  <div className="flex justify-center">
                    <Link href="/login">
                      <Button className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Button>
                    </Link>
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
            Forgot Password
          </h1>
          <p className="hockey-subtitle mb-8">
            Enter your email address and we'll send you a link to reset your password
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
              Password Reset Request
            </CardTitle>
            <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">We'll send you a secure link to reset your password</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500"
                  required
                />
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Send Reset Link
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
