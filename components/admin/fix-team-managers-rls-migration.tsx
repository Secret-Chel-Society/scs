"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"

export default function FixTeamManagersRlsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/fix-team-managers-rls", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: "Team managers RLS policies fixed successfully!",
          details: data,
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to fix team managers RLS policies",
          details: data,
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An error occurred while fixing RLS policies",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Fix Team Managers RLS Policies
          </CardTitle>
          <CardDescription>
            This migration fixes the Row Level Security (RLS) policies on the team_managers table to allow proper role
            updates and team management operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>What this migration does:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Fixes RLS policies on team_managers table</li>
                <li>Allows admins to create/update team manager records</li>
                <li>Creates helper functions for permission checking</li>
                <li>Sets up automatic syncing between players and team_managers tables</li>
                <li>Ensures proper security while allowing necessary operations</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button onClick={runMigration} disabled={isRunning} className="flex items-center gap-2">
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isRunning ? "Running Migration..." : "Run Migration"}
            </Button>
          </div>

          {result && (
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className={result.success ? "text-green-800" : "text-red-800"}>
                  <p className="font-medium">{result.message}</p>
                  {result.details && (
                    <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> This migration is safe to run multiple times. It will update the RLS policies to
              allow proper team management operations while maintaining security.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
