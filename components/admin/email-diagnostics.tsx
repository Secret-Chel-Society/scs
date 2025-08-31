"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function EmailDiagnostics() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const testEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/admin/email-diagnostics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to test email")
      }

      setResult(data)
      toast({
        title: "Success",
        description: "Email test completed",
      })
    } catch (error: any) {
      console.error("Error testing email:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to test email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-500" />
          Email Diagnostics
        </CardTitle>
        <CardDescription>
          Test email system configuration and send test emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address to test"
            />
          </div>

          <Button onClick={testEmail} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Email...
              </>
            ) : (
              "Test Email"
            )}
          </Button>

          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Test Results</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
