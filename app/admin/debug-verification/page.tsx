"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

export default function DebugVerificationPage() {
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testVerification = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/auth/verify-email-debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token || undefined,
          email: email || undefined,
          type: "signup",
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const manualCreateUser = async () => {
    if (!email) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/auth/manual-create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const freshVerification = async () => {
    if (!email) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/auth/fresh-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Verification Debug</h1>
        <p className="text-muted-foreground">Debug email verification and user creation process</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Email Verification</CardTitle>
            <CardDescription>Test the email verification process with detailed logging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="token">Verification Token (optional)</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter verification token if you have one"
              />
            </div>
            <Button onClick={testVerification} disabled={loading || (!email && !token)}>
              {loading ? "Testing..." : "Test Verification"}
            </Button>
            <Button onClick={freshVerification} disabled={loading || !email} variant="secondary">
              {loading ? "Processing..." : "Fresh Verification (Bypass Token)"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual User Creation</CardTitle>
            <CardDescription>Manually create a user profile for a verified email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="manual-email">Email</Label>
              <Input
                id="manual-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <Button onClick={manualCreateUser} disabled={loading || !email}>
              {loading ? "Creating..." : "Create User Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <Alert variant="destructive">
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  {result.success ? "✅ Success!" : "❌ Failed"} - {result.message}
                </AlertDescription>
              </Alert>
            )}
            <div className="mt-4">
              <Label>Full Response:</Label>
              <Textarea value={JSON.stringify(result, null, 2)} readOnly className="mt-2 h-64 font-mono text-sm" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
