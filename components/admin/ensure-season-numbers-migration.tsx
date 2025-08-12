"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function EnsureSeasonNumbersMigration() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function runMigration() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/run-migration/ensure-season-numbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult(data)
      toast({
        title: "Migration successful",
        description: "Season numbers have been updated to match their names",
      })
    } catch (error: any) {
      console.error("Error running migration:", error)
      toast({
        title: "Migration failed",
        description: error.message || "An error occurred while running the migration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ensure Season Numbers Match Names</CardTitle>
        <CardDescription>
          This migration ensures that all season numbers match their names. For example, "Season 1" will have number=1.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will fix issues where season numbers are incorrect or missing, ensuring consistency across the
          application.
        </p>
        {result && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Migration Result:</h4>
            <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={loading}>
          {loading ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
