"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export function WaiversSystemMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/waivers-system", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
        toast({
          title: "Migration Successful",
          description: "Waivers system tables created successfully",
        })
      } else {
        setResult({ success: false, message: data.error })
        toast({
          title: "Migration Failed",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setResult({ success: false, message: errorMessage })
      toast({
        title: "Migration Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waivers System Migration</CardTitle>
        <CardDescription>
          Create the necessary database tables and functions for the waiver wire system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">This migration will create:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• waivers table - tracks waived players</li>
            <li>• waiver_claims table - tracks team claims on waived players</li>
            <li>• waiver_priority table - manages waiver priority order</li>
            <li>• process_expired_waivers function - handles automatic processing</li>
          </ul>
        </div>

        <Button onClick={runMigration} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            "Run Waivers System Migration"
          )}
        </Button>

        {result && (
          <div
            className={`flex items-center space-x-2 p-3 rounded-md ${
              result.success
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
            }`}
          >
            {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span className="text-sm">{result.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
