"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function TradesTableMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/admin/run-migration/trades-table-structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data.message)
        console.log("Migration completed:", data)
      } else {
        setError(data.error || "Migration failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trades Table Structure Migration</CardTitle>
        <CardDescription>
          Ensures the trades table has the correct structure with team1_id, team2_id, team1_players, team2_players,
          status, and created_at columns.
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
            "Run Trades Table Migration"
          )}
        </Button>

        {result && (
          <Alert>
            <AlertDescription className="text-green-600">{result}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
