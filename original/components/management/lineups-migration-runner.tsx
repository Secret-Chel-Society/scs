"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function LineupsMigrationRunner() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)

  const runMigration = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/lineups-table", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message || "Migration completed successfully" })
        toast({
          title: "Success",
          description: "Lineups table created successfully. Please refresh the page.",
        })
      } else {
        setResult({
          success: false,
          error: data.error || "Failed to run migration",
          message: data.details || "Unknown error",
        })
        toast({
          title: "Error",
          description: "Failed to create lineups table. Please contact an administrator.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: "Migration failed",
        message: error.message || "An unexpected error occurred",
      })
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lineups Feature Setup</CardTitle>
        <CardDescription>
          The lineups feature needs to be set up before you can manage your team's lineups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will create the necessary database tables to manage team lineups for matches. This is a one-time setup
          that enables the lineup management feature.
        </p>

        {result && (
          <Alert className={result.success ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>
              {result.message}
              {result.error && <div className="text-sm mt-2 text-red-600 dark:text-red-400">{result.error}</div>}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Setting Up..." : "Set Up Lineups Feature"}
        </Button>
      </CardFooter>
    </Card>
  )
}
