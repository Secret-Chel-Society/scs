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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Fix Waiver Tables Migration</CardTitle>
        <CardDescription>
          This migration will fix the waiver priority and waiver claims tables by recreating them with the correct
          schema. It will also initialize waiver priority for all active teams based on current standings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Warning</h3>
              <div className="text-sm text-amber-700">
                <p>
                  This migration will drop and recreate the waiver_priority and waiver_claims tables. Any existing data
                  in these tables will be lost. Make sure you have a backup if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="text-sm text-green-700">
                  <p>{result}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning || isComplete} className="w-full">
          {isRunning ? "Running Migration..." : isComplete ? "Migration Complete" : "Fix Waiver Tables"}
        </Button>
      </CardFooter>
    </Card>
  )
}
