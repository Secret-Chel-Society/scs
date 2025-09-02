"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"

export function PlayerAwardsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setStatus("idle")
    setMessage("")

    try {
      const response = await fetch("/api/admin/run-migration/player-awards", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setStatus("success")
      setMessage(data.message || "Migration completed successfully")
      toast({
        title: "Migration Successful",
        description: "Player awards table has been created",
      })
    } catch (error: any) {
      setStatus("error")
      setMessage(error.message || "An error occurred")
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to run migration",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Awards Table Migration</CardTitle>
        <CardDescription>Create the player_awards table if it doesn't exist</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <CheckCircle className="h-5 w-5" />
            <p>{message}</p>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            <p>{message}</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          This migration will create the player_awards table if it doesn't already exist in the database. The table will
          store information about awards won by players.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning}>
          {isRunning ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
