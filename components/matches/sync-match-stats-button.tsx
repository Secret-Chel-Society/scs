"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SyncMatchStatsButtonProps {
  matchId: string
}

export function SyncMatchStatsButton({ matchId }: SyncMatchStatsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSync = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/matches/sync-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team statistics synced successfully for this match.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to sync team statistics",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={isLoading} className="flex items-center gap-1">
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      <span>{isLoading ? "Syncing..." : "Sync Stats"}</span>
    </Button>
  )
}
