"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function FixWaiversPage() {
  const [isFixing, setIsFixing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  const handleFixWaivers = async () => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to fix the waiver system",
        variant: "destructive",
      })
      return
    }

    setIsFixing(true)
    setError(null)
    setLastResult(null)

    try {
      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !freshSession) {
        throw new Error("Authentication session expired")
      }

      const response = await fetch("/api/admin/run-migration/fix-waiver-system-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshSession.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fix waiver system")
      }

      setLastResult(result)
      toast({
        title: "Waiver System Fixed",
        description: result.message || "Waiver system has been fixed successfully",
      })
    } catch (error: any) {
      console.error("Error fixing waiver system:", error)
      setError(error.message || "Failed to fix waiver system")
      toast({
        title: "Error",
        description: error.message || "Failed to fix waiver system",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  const handleTestWaivers = async () => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to test the waiver system",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)
    setError(null)
    setTestResult(null)

    try {
      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !freshSession) {
        throw new Error("Authentication session expired")
      }

      const response = await fetch("/api/admin/test-waiver-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshSession.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to test waiver system")
      }

      setTestResult(result)
      toast({
        title: "Waiver System Tested",
        description: result.summary?.all_tables_exist ? "All tests passed!" : "Some tests failed",
      })
    } catch (error: any) {
      console.error("Error testing waiver system:", error)
      setError(error.message || "Failed to test waiver system")
      toast({
        title: "Error",
        description: error.message || "Failed to test waiver system",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Fix Waiver System</h1>
          <p className="text-muted-foreground">
            This will fix the waiver system by correcting database schema mismatches and initializing priority data.
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This will drop and recreate the waiver_priority and waiver_claims tables. 
            Any existing waiver claims will be lost. Make sure to backup your data before proceeding.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Waiver System Fix</CardTitle>
            <CardDescription>
              Run the complete waiver system migration to fix schema issues and initialize priority data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleFixWaivers} 
                disabled={isFixing || isTesting} 
                className="w-full"
                size="lg"
              >
                {isFixing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  "Fix Waiver System"
                )}
              </Button>

              <Button 
                onClick={handleTestWaivers} 
                disabled={isFixing || isTesting} 
                variant="outline"
                className="w-full"
                size="lg"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Waiver System"
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {lastResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Status:</strong> {lastResult.success ? "Success" : "Failed"}</p>
                    <p><strong>Message:</strong> {lastResult.message}</p>
                    {lastResult.priorityRecords !== undefined && (
                      <p><strong>Priority Records:</strong> {lastResult.priorityRecords}</p>
                    )}
                    {lastResult.claimsRecords !== undefined && (
                      <p><strong>Claims Records:</strong> {lastResult.claimsRecords}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {testResult && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Test Results:</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>All Tables Exist:</strong> {testResult.summary?.all_tables_exist ? "✅ Yes" : "❌ No"}</p>
                  <p><strong>Has Priority Data:</strong> {testResult.summary?.has_priority_data ? "✅ Yes" : "❌ No"}</p>
                  <p><strong>Has Active Teams:</strong> {testResult.summary?.has_active_teams ? "✅ Yes" : "❌ No"}</p>
                  <p><strong>Has Active Waivers:</strong> {testResult.summary?.has_active_waivers ? "✅ Yes" : "❌ No"}</p>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">Full Test Details</summary>
                  <pre className="text-xs overflow-auto max-h-64 mt-2">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {lastResult && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Fix Response:</h4>
                <pre className="text-sm overflow-auto max-h-64">
                  {JSON.stringify(lastResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
