"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Database, CheckCircle, AlertCircle } from "lucide-react"

export function TestVerificationStorage() {
  const [email, setEmail] = useState("test@example.com")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testStorage = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/debug/test-verification-storage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to test storage")
      }

      setResult(data)
    } catch (err: any) {
      console.error("Storage test error:", err)
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test Verification Token Storage
          </CardTitle>
          <CardDescription>Test if we can store tokens in the verification_tokens table</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email</Label>
            <Input
              id="test-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <Button onClick={testStorage} disabled={isLoading || !email}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Testing Storage..." : "Test Token Storage"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert className={result.success ? "border-green-500" : "border-red-500"}>
          {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{result.success ? "Success" : "Failed"}</AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <p>{result.message || result.error}</p>
              {result.tokenData && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-medium mb-2">Token Data:</h4>
                  <pre className="text-xs overflow-x-auto">{JSON.stringify(result.tokenData, null, 2)}</pre>
                </div>
              )}
              {result.details && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium mb-2">Error Details:</h4>
                  <pre className="text-xs overflow-x-auto">{JSON.stringify(result.details, null, 2)}</pre>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
