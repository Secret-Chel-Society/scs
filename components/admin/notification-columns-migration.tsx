"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NotificationColumnsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const runMigration = async () => {
    setIsRunning(true)
    setStatus("idle")
    setMessage("")

    try {
      const response = await fetch("/api/admin/run-migration/notification-columns", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setStatus("success")
      setMessage("Successfully added notification columns to users table")
    } catch (error: any) {
      setStatus("error")
      setMessage(error.message || "An error occurred while running the migration")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Notification Columns Migration</CardTitle>
        <CardDescription>Add avatar_url and notification preference columns to the users table</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          This migration will add the following columns to the users table if they don't exist:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
          <li>avatar_url (TEXT)</li>
          <li>email_notifications (BOOLEAN)</li>
          <li>game_notifications (BOOLEAN)</li>
          <li>news_notifications (BOOLEAN)</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning}>
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
