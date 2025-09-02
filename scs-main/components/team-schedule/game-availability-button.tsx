"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface GameAvailabilityButtonProps {
  matchId: string
  playerId: string
  userId: string
  teamId: string
  currentStatus?: "available" | "unavailable" | null
  onStatusChange?: (status: "available" | "unavailable") => void
}

export function GameAvailabilityButton({
  matchId,
  playerId,
  userId,
  teamId,
  currentStatus,
  onStatusChange,
}: GameAvailabilityButtonProps) {
  const [status, setStatus] = useState<"available" | "unavailable" | null>(currentStatus || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const { toast } = useToast()

  // Fetch current availability status on mount
  useEffect(() => {
    async function fetchCurrentStatus() {
      try {
        const response = await fetch(`/api/game-availability?matchId=${matchId}&userId=${userId}&teamId=${teamId}`)

        if (response.ok) {
          const data = await response.json()
          if (data.data && data.data.length > 0) {
            setStatus(data.data[0].status)
          }
        }
      } catch (error) {
        console.error("Error fetching availability status:", error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    if (matchId && userId && teamId) {
      fetchCurrentStatus()
    } else {
      setIsInitialLoading(false)
    }
  }, [matchId, userId, teamId])

  const updateAvailability = async (newStatus: "available" | "unavailable") => {
    if (!matchId || !playerId || !userId || !teamId) {
      toast({
        title: "Error",
        description: "Missing required information to update availability",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("Updating availability:", {
        match_id: matchId,
        player_id: playerId,
        user_id: userId,
        team_id: teamId,
        status: newStatus,
      })

      const response = await fetch("/api/game-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: matchId,
          player_id: playerId,
          user_id: userId,
          team_id: teamId,
          status: newStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update availability")
      }

      setStatus(newStatus)
      onStatusChange?.(newStatus)

      toast({
        title: "Availability Updated",
        description: `You are marked as ${newStatus} for this game.`,
      })

      console.log("Availability updated successfully:", data)
    } catch (error: any) {
      console.error("Error updating availability:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update availability",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled>
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading...
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={status === "available" ? "default" : "outline"}
        onClick={() => updateAvailability("available")}
        disabled={isLoading}
        className={`flex items-center gap-1 ${
          status === "available"
            ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
            : "hover:bg-green-50 hover:text-green-700 hover:border-green-300"
        }`}
      >
        {isLoading && status !== "available" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <CheckCircle className="h-3 w-3" />
        )}
        Available
      </Button>

      <Button
        size="sm"
        variant={status === "unavailable" ? "destructive" : "outline"}
        onClick={() => updateAvailability("unavailable")}
        disabled={isLoading}
        className={`flex items-center gap-1 ${
          status === "unavailable"
            ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
            : "hover:bg-red-50 hover:text-red-700 hover:border-red-300"
        }`}
      >
        {isLoading && status !== "unavailable" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <XCircle className="h-3 w-3" />
        )}
        Unavailable
      </Button>
    </div>
  )
}
