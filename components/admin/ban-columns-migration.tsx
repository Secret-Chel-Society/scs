"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export function BanColumnsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/admin/run-migration/ban-columns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Migration failed")
      }

      setResult(data.message || "Migration completed successfully")
      toast({
        title: "Success",
        description: "Ban columns migration completed successfully",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
      setError(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Ban Columns Migration</CardTitle>
        <CardDescription>Add ban_reason, ban_expiration, and is_banned columns to the users table</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runMigration} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            "Run Ban Columns Migration"
          )}
        </Button>

        {result && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{result}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>This migration will:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Add ban_reason column (TEXT, nullable)</li>
            <li>Add ban_expiration column (TIMESTAMP WITH TIME ZONE, nullable)</li>
            <li>Add is_banned column (BOOLEAN, default FALSE)</li>
            <li>Create performance indexes on ban-related columns</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
