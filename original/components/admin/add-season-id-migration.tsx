"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function AddSeasonIdMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { toast } = useToast()

  async function runMigration() {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/add-season-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult("Migration completed successfully")
      toast({
        title: "Success",
        description: "The season_id column has been added to the season_registrations table",
      })
    } catch (error: any) {
      console.error("Error running migration:", error)
      setResult(`Error: ${error.message}`)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Season ID Column</CardTitle>
        <CardDescription>
          Add the season_id column to the season_registrations table if it doesn't exist
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration will add a season_id column to the season_registrations table, which is required for filtering
          registrations by season.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={runMigration} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Run Migration
        </Button>
        {result && (
          <p className={`text-sm ${result.includes("Error") ? "text-red-500" : "text-green-500"}`}>{result}</p>
        )}
      </CardFooter>
    </Card>
  )
}
