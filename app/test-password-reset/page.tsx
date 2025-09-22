"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export default function TestPasswordResetPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testPasswordReset = async () => {
    if (!email) {
      setError("Please enter an email address")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/auth/reset-password-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult({
          success: true,
          message: "Password reset email sent successfully",
          data: data
        })
      } else {
        setError(data.error || "Failed to send password reset email")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectReset = async () => {
    if (!email) {
      setError("Please enter an email address")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const supabase = createClient()
      
      // Test direct Supabase password reset
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://www.secretchelsociety.com/reset-password"
      })

      if (error) {
        setError(`Supabase error: ${error.message}`)
      } else {
        setResult({
          success: true,
          message: "Direct Supabase password reset sent",
          data: data
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Password Reset Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to test"
                className="w-full"
              />
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={testPasswordReset} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Testing..." : "Test API Route"}
              </Button>
              
              <Button 
                onClick={testDirectReset} 
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? "Testing..." : "Test Direct Supabase"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{result.message}</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">Instructions:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Enter an email address above</li>
                <li>Click "Test API Route" to test our custom API</li>
                <li>Click "Test Direct Supabase" to test direct Supabase call</li>
                <li>Check your email for the reset link</li>
                <li>Click the link and see if it works</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
