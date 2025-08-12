"use client"

// Update the button component to ensure it properly triggers the sync

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"

interface SyncPlayerStatsButtonProps {
  matchId: string
  eaMatchId: string | null
  disabled?: boolean
  onSuccess?: () => void
}

export function SyncPlayerStatsButton({ matchId, eaMatchId, disabled = false, onSuccess }: SyncPlayerStatsButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const { toast } = useToast()
  const { supabase, session } = useSupabase()

  const handleSync = async () => {
    if (!eaMatchId) {
      toast({
        title: "Error",
        description: "This match does not have EA data to sync",
        variant: "destructive",
      })
      return
    }

    try {
      setSyncing(true)
      setSynced(false)

      // Get the current user's token
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to sync player statistics",
          variant: "destructive",
        })
        return
      }

      // Call the API to sync player stats
      const response = await fetch("/api/matches/sync-player-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ matchId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync player statistics")
      }

      // Also update the match status to Completed if it's not already
      const { data: match } = await supabase.from("matches").select("status").eq("id", matchId).single()

      if (match && match.status !== "Completed") {
        await supabase.from("matches").update({ status: "Completed" }).eq("id", matchId)
      }

      setSynced(true)
      toast({
        title: "Success",
        description: "Player statistics have been synced successfully",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error syncing player stats:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to sync player statistics",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button
      onClick={handleSync}
      disabled={disabled || syncing || !eaMatchId}
      variant={synced ? "outline" : "default"}
      size="sm"
      className="flex items-center gap-2"
    >
      {syncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : synced ? (
        <>
          <Check className="h-4 w-4" />
          Synced
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Sync Player Stats
        </>
      )}
    </Button>
  )
}
