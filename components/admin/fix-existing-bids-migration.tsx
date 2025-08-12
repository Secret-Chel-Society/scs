"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export function FixExistingBidsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/fix-existing-bids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Migration failed")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Fix Existing Bids Finalization
        </CardTitle>
        <CardDescription>
          This migration will fix all existing bids by:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Mark all bids created before 2025-06-25 as finalized</li>
            <li>Fix won_bid status by checking actual player team assignments</li>
            <li>Ensure processed bids are properly finalized</li>
            <li>Update status consistency</li>
          </ul>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runMigration} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">{result.message}</p>
                {result.stats && (
                  <div className="text-sm">
                    <p>Total bids: {result.stats.totalBids}</p>
                    <p>Finalized bids: {result.stats.finalizedBids}</p>
                    <p>Won bids: {result.stats.wonBids}</p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
