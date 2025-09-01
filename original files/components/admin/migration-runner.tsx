"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function MigrationRunner() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  const runMigration = async (migrationName: string) => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch(`/api/run-migration/${migrationName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult({ success: true })
      toast({
        title: "Migration Successful",
        description: data.message || "Migration completed successfully",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
      setResult({ error: error.message })
      toast({
        title: "Migration Failed",
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
        <CardTitle>Database Migrations</CardTitle>
        <CardDescription>Run database migrations to update the schema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result?.success && (
          <Alert className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Migration completed successfully
            </AlertDescription>
          </Alert>
        )}

        {result?.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Available Migrations</h3>
          <div className="border rounded-md p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Trades Table</h4>
                <p className="text-sm text-muted-foreground">
                  Creates the trades table to track player trades between teams
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => runMigration("trades-table")} disabled={isRunning}>
                {isRunning ? "Running..." : "Run Migration"}
              </Button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <h4 className="font-medium">IP Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Adds IP tracking functionality to monitor user logins and registrations
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => runMigration("ip-tracking")} disabled={isRunning}>
                {isRunning ? "Running..." : "Run Migration"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Note: Migrations should only be run once. Running them multiple times is safe but unnecessary.
      </CardFooter>
    </Card>
  )
}
