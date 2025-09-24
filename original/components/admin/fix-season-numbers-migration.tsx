"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function FixSeasonNumbersMigration() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function runMigration() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/run-migration/fix-season-numbers", {
        method: "POST",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to run migration: ${errorText}`)
      }

      const data = await response.json()
      setResult(data)

      toast({
        title: "Migration successful",
        description: "Season numbers have been fixed.",
      })
    } catch (error: any) {
      console.error("Error running migration:", error)
      toast({
        title: "Migration failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Season Numbers</CardTitle>
        <CardDescription>
          This migration will update the number column in the seasons table based on the season name.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will ensure that Season 1 has number=1, Season 2 has number=2, etc., fixing any mismatches between season
          names and numbers.
        </p>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h3 className="font-semibold mb-2">Migration Result:</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
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
