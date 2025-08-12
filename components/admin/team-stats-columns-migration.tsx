"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface TeamStatsColumnsMigrationProps {
  onComplete?: () => void
}

export function TeamStatsColumnsMigration({ onComplete }: TeamStatsColumnsMigrationProps) {
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      const response = await fetch("/api/admin/run-migration/team-stats-columns", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run migration")
      }

      toast({
        title: "Migration successful",
        description: "The points and games_played columns have been added to the teams table.",
      })

      if (onComplete) {
        onComplete()
      }
    } catch (error: any) {
      console.error("Error running migration:", error)
      toast({
        title: "Migration failed",
        description: error.message || "Failed to add columns to the teams table.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={runMigration} disabled={isRunning}>
      {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Run Migration
    </Button>
  )
}
