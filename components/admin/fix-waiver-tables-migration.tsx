"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle } from "lucide-react"

export function FixWaiverTablesMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/fix-waiver-tables", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult(data.message || "Migration completed successfully")
      setIsComplete(true)
      toast({
        title: "Success",
        description: "Waiver tables have been fixed successfully",
      })
    } catch (err: any) {
      console.error("Migration error:", err)
      setError(err.message || "An unknown error occurred")
      toast({
        title: "Error",
        description: err.message || "Failed to run migration",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="w-full hockey-premium-card">
      <CardHeader>
        <CardTitle className="hockey-title text-2xl flex items-center justify-center gap-3">
          <div className="hockey-feature-icon">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          Fix Waiver Tables Migration
        </CardTitle>
        <CardDescription className="hockey-subtitle text-center">
          This migration will fix the waiver priority and waiver claims tables by recreating them with the correct
          schema. It will also initialize waiver priority for all active teams based on current standings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="hockey-premium-card bg-gradient-to-br from-rink-blue-25 to-rink-blue-50 dark:from-rink-blue-950/30 dark:to-rink-blue-900/30 border-2 border-rink-blue-200 dark:border-rink-blue-700">
          <div className="flex items-start gap-3">
            <div className="hockey-feature-icon bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="hockey-title text-lg text-rink-blue-800 dark:text-rink-blue-200 mb-2">Warning</h3>
              <div className="hockey-subtitle text-rink-blue-700 dark:text-rink-blue-300">
                <p>
                  This migration will drop and recreate the waiver_priority and waiver_claims tables. Any existing data
                  in these tables will be lost. Make sure you have a backup if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="hockey-premium-card bg-gradient-to-br from-goal-red-25 to-goal-red-50 dark:from-goal-red-950/30 dark:to-goal-red-900/30 border-2 border-goal-red-200 dark:border-goal-red-700">
            <div className="flex items-start gap-3">
              <div className="hockey-feature-icon bg-gradient-to-r from-goal-red-500 to-goal-red-600 flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="hockey-title text-lg text-goal-red-800 dark:text-goal-red-200 mb-2">Error</h3>
                <div className="hockey-subtitle text-goal-red-700 dark:text-goal-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="hockey-premium-card bg-gradient-to-br from-assist-green-25 to-assist-green-50 dark:from-assist-green-950/30 dark:to-assist-green-900/30 border-2 border-assist-green-200 dark:border-assist-green-700">
            <div className="flex items-start gap-3">
              <div className="hockey-feature-icon bg-gradient-to-r from-assist-green-500 to-assist-green-600 flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="hockey-title text-lg text-assist-green-800 dark:text-assist-green-200 mb-2">Success</h3>
                <div className="hockey-subtitle text-assist-green-700 dark:text-assist-green-300">
                  <p>{result}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning || isComplete} className="w-full hockey-button-enhanced">
          {isRunning ? "Running Migration..." : isComplete ? "Migration Complete" : "Fix Waiver Tables"}
        </Button>
      </CardFooter>
    </Card>
  )
}
