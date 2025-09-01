"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function FixSeasonIdTypeMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const runMigration = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Get the session token
      const token = localStorage.getItem("supabase.auth.token")

      const response = await fetch("/api/admin/run-migration/fix-season-id-type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult({
        success: true,
        message: data.message || "Migration completed successfully",
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An error occurred while running the migration",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Season ID Column Type</CardTitle>
        <CardDescription>
          Changes the season_id column in the matches table from integer to UUID to support UUID-based seasons.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration checks if the season_id column in the matches table is an integer type, and if so, changes it
          to UUID type. This allows you to use UUID-based seasons with your matches. Note that this will clear any
          existing season associations, which you'll need to re-establish.
        </p>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading}>
          {isLoading ? "Running..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
