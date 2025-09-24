"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function UpdateRegistrationsMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { toast } = useToast()

  async function runMigration() {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/update-registrations", {
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
        description: "Existing registrations have been updated with the current active season",
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
        <CardTitle>Update Existing Registrations</CardTitle>
        <CardDescription>
          Update existing registrations to use the current active season if they don't have a season_id
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration will update all registrations that don't have a season_id to use the current active season.
          This ensures that all registrations are properly associated with a season.
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
