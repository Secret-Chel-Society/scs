"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function AutoUserCreationMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/auto-user-creation", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, message: data.error || "Migration failed" })
      }
    } catch (error) {
      setResult({ success: false, message: "Network error occurred" })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">🤖 Auto User Creation Migration</CardTitle>
        <CardDescription>
          Creates a database trigger that automatically creates user profiles when users verify their email. This
          eliminates the need for manual user refresh in the admin panel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">What this migration does:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Creates a database function that triggers on email confirmation</li>
            <li>• Automatically creates user records in public.users table</li>
            <li>• Automatically creates player records with "Player" role</li>
            <li>• Automatically creates user_roles records</li>
            <li>• Handles console value validation and metadata extraction</li>
          </ul>
        </div>

        <Button onClick={runMigration} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            "Run Auto User Creation Migration"
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
