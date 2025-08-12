"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export function RlsSeasonRegistrationsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/admin/run-migration/rls-season-registrations", {
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
        description: "RLS policies migration completed successfully",
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
        <CardTitle>Season Registrations RLS Migration</CardTitle>
        <CardDescription>Set up Row Level Security policies to prevent banned users from registering</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runMigration} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            "Run RLS Migration"
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
            <li>Enable Row Level Security on season_registrations table</li>
            <li>Create policy to prevent banned users from inserting registrations</li>
            <li>Create policies for users to read their own registrations</li>
            <li>Create policies for admins to manage all registrations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
