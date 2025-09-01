"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function PopulateTeamManagersMigration() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/populate-team-managers", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult({
        success: true,
        message: data.message || "Migration completed successfully",
      })

      toast({
        title: "Migration Successful",
        description: data.message || "Team managers table has been populated successfully",
      })
    } catch (error: any) {
      console.error("Error running migration:", error)
      setResult({
        success: false,
        message: error.message || "An error occurred while running the migration",
      })

      toast({
        title: "Migration Failed",
        description: error.message || "Failed to populate team managers table",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Populate Team Managers Table</CardTitle>
        <CardDescription>
          This migration will populate the team_managers table based on existing player roles (GM, AGM, Owner).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will create team manager entries for players who have GM, AGM, or Owner roles and are assigned to a team.
          This ensures that team managers have proper permissions to manage their teams.
        </p>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
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
