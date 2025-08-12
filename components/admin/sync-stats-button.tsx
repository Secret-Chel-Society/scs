"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw } from "lucide-react"

interface SyncStatsButtonProps {
  seasonId: number
  onSuccess?: () => void
}

export function SyncStatsButton({ seasonId, onSuccess }: SyncStatsButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  const handleSync = async () => {
    if (!seasonId) {
      toast({
        title: "Error",
        description: "Please select a season first",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSyncing(true)

      const response = await fetch("/api/admin/sync-season-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seasonId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to sync statistics")
      }

      toast({
        title: "Statistics synchronized",
        description: `Successfully synced stats for ${data.stats.players} players and ${data.stats.goalies} goalies.`,
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error syncing statistics:", error)
      toast({
        title: "Sync failed",
        description: error.message || "An error occurred while syncing statistics",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={isSyncing} variant="outline">
      <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Statistics"}
    </Button>
  )
}
