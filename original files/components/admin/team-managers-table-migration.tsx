"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function TeamManagersTableMigration() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/team-managers-table-if-not-exists", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult("Migration completed successfully")
      toast({
        title: "Success",
        description: "Team managers table migration completed successfully",
      })
    } catch (error: any) {
      console.error("Error running migration:", error)
      setResult(`Error: ${error.message}`)
      toast({
        title: "Error",
        description: `Failed to run migration: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Team Managers Table</CardTitle>
        <CardDescription>
          This migration will create the team_managers table if it doesn't exist. This table is used to store team
          manager information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && <div className={result.includes("Error") ? "text-red-500" : "text-green-500"}>{result}</div>}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Migration...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
