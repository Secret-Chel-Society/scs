"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw } from "lucide-react"

export function SyncEaStatsButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  const handleSync = async () => {
    try {
      setIsSyncing(true)

      const response = await fetch("/api/admin/sync-ea-stats", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync EA stats")
      }

      toast({
        title: "Success",
        description: data.message,
      })
    } catch (error: any) {
      console.error("Error syncing EA stats:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to sync EA stats",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={isSyncing} variant="outline">
      {isSyncing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync EA Stats
        </>
      )}
    </Button>
  )
}
