"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function TeamsActiveMigration({ onComplete }: { onComplete?: () => void }) {
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      const response = await fetch("/api/admin/run-migration/teams-active", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run migration")
      }

      const data = await response.json()

      toast({
        title: "Migration successful",
        description: "Added is_active column to teams table",
      })

      if (onComplete) {
        onComplete()
      }
    } catch (error: any) {
      console.error("Migration error:", error)
      toast({
        title: "Migration failed",
        description: error.message || "An error occurred during migration",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Button onClick={runMigration} disabled={isRunning}>
      {isRunning ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Running Migration...
        </>
      ) : (
        "Add Teams Active Status"
      )}
    </Button>
  )
}
