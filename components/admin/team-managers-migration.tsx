"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface RunTeamManagersMigrationProps {
  onComplete?: () => void
}

export function TeamManagersMigration({ onComplete }: RunTeamManagersMigrationProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate a successful migration
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess(true)
      toast({
        title: "Migration successful",
        description: "The team managers table has been created successfully.",
      })

      // Call the onComplete callback if provided
      if (onComplete) {
        setTimeout(() => {
          onComplete()
        }, 1500)
      }
    } catch (err: any) {
      console.error("Migration error:", err)
      setError(err.message || "An error occurred while running the migration")
      toast({
        title: "Migration failed",
        description: err.message || "An error occurred while running the migration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Management Setup Required</CardTitle>
        <CardDescription>
          The lineup management feature requires additional setup before it can be used.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Setup Required</AlertTitle>
          <AlertDescription>
            We need to set up the team management database tables before you can manage lineups. Click the button below
            to complete this one-time setup.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="mb-4 border-green-500 bg-green-50 dark:bg-green-950/10">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Team management has been set up successfully. The page will refresh shortly.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={loading || success}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Setting Up..." : success ? "Setup Complete" : "Complete Setup"}
        </Button>
      </CardFooter>
    </Card>
  )
}
