"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ManualOverrideMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/admin/run-migration/manual-override", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setSuccess(true)
      toast({
        title: "Migration successful",
        description: "The manual override column has been added to the teams table.",
      })
    } catch (error: any) {
      console.error("Error running migration:", error)
      setError(error.message || "Failed to run migration")
      toast({
        title: "Error",
        description: error.message || "Failed to run migration",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Manual Override Migration</AlertTitle>
        <AlertDescription>
          This migration adds a manual_override column to the teams table, which allows administrators to manually edit
          team statistics.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>The manual override column has been added to the teams table.</AlertDescription>
        </Alert>
      )}

      <Button onClick={runMigration} disabled={isRunning}>
        {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Run Migration
      </Button>
    </div>
  )
}
