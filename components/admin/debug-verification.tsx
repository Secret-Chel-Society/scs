"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function DebugVerification() {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState("")
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const debugVerification = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/admin/debug-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to debug verification")
      }

      setResult(data)
      toast({
        title: "Success",
        description: "Verification debug completed",
      })
    } catch (error: any) {
      console.error("Error debugging verification:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to debug verification",
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
          <Shield className="h-5 w-5 text-blue-500" />
          Debug Verification
        </CardTitle>
        <CardDescription>
          Debug user verification status and related data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID to debug"
            />
          </div>

          <Button onClick={debugVerification} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Debugging...
              </>
            ) : (
              "Debug Verification"
            )}
          </Button>

          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Debug Results</AlertTitle>
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
