"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { Heart, Loader2 } from "lucide-react"

interface Match {
  id: string
  match_date: string
}

interface InjuryReserveButtonProps {
  teamId: string
  isUserOnTeam: boolean
  matches: Match[]
  currentSeasonId: string | number
}

interface InjuryReserve {
  id: string
  week_start_date: string
  week_end_date: string
  week_number: number
  reason: string | null
  status: string
}

export function InjuryReserveButton({ teamId, isUserOnTeam, matches, currentSeasonId }: InjuryReserveButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [existingIR, setExistingIR] = useState<InjuryReserve | null>(null)
  const [checkingIR, setCheckingIR] = useState(true)
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  // Calculate week dates from matches
  const getWeekDates = () => {
    if (matches.length === 0) return null

    const matchDates = matches.map((match) => new Date(match.match_date))
    const earliestDate = new Date(Math.min(...matchDates.map((date) => date.getTime())))
    const latestDate = new Date(Math.max(...matchDates.map((date) => date.getTime())))

    // Set to start of week (Monday)
    const weekStart = new Date(earliestDate)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)

    // Set to end of week (Sunday)
    const weekEnd = new Date(latestDate)
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()))

    return { weekStart, weekEnd }
  }

  // Check for existing IR request for this week
  useEffect(() => {
    async function checkExistingIR() {
      if (!session?.user || !isUserOnTeam || matches.length === 0) {
        setCheckingIR(false)
        return
      }

      try {
        const weekDates = getWeekDates()
        if (!weekDates) {
          setCheckingIR(false)
          return
        }

        const { data, error } = await supabase
          .from("injury_reserves")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("team_id", teamId)
          .eq("season_id", currentSeasonId.toString())
          .eq("status", "active")
          .gte("week_end_date", weekDates.weekStart.toISOString().split("T")[0])
          .lte("week_start_date", weekDates.weekEnd.toISOString().split("T")[0])
          .maybeSingle()

        if (error && error.code !== "PGRST116") {
          console.error("Error checking existing IR:", error)
        } else if (data) {
          setExistingIR(data)
        }
      } catch (error) {
        console.error("Error checking existing IR:", error)
      } finally {
        setCheckingIR(false)
      }
    }

    checkExistingIR()
  }, [supabase, session, teamId, isUserOnTeam, matches, currentSeasonId])

  const handleSubmitIR = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please log in to request injury reserve.",
        variant: "destructive",
      })
      return
    }

    const weekDates = getWeekDates()
    if (!weekDates) {
      toast({
        title: "Error",
        description: "Unable to determine week dates from matches.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Get player ID for the current user on this team
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("team_id", teamId)
        .maybeSingle()

      // Calculate week number (simple calculation based on week start date)
      const weekNumber = Math.ceil(
        (weekDates.weekStart.getTime() - new Date(2024, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
      )

      const response = await fetch("/api/injury-reserves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: session.user.id,
          team_id: teamId,
          season_id: currentSeasonId.toString(),
          week_start_date: weekDates.weekStart.toISOString().split("T")[0],
          week_end_date: weekDates.weekEnd.toISOString().split("T")[0],
          week_number: weekNumber,
          reason: reason.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit IR request")
      }

      const data = await response.json()
      setExistingIR(data.data || data.injuryReserve)
      setOpen(false)
      setReason("")

      toast({
        title: "IR request submitted",
        description:
          "Your injury reserve request has been submitted for this week. You are now marked as unavailable for all games this week.",
      })
    } catch (error: any) {
      console.error("Error submitting IR request:", error)
      toast({
        title: "Error submitting IR request",
        description: error.message || "Failed to submit injury reserve request.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelIR = async () => {
    if (!existingIR || !session?.user) return

    setLoading(true)

    try {
      const response = await fetch(`/api/injury-reserves/${existingIR.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to cancel IR request")
      }

      setExistingIR(null)

      toast({
        title: "IR request cancelled",
        description: "Your injury reserve request has been cancelled.",
      })
    } catch (error: any) {
      console.error("Error cancelling IR request:", error)
      toast({
        title: "Error cancelling IR request",
        description: error.message || "Failed to cancel injury reserve request.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDialogOpenChange = (newOpen: boolean) => {
    console.log("Dialog open change:", newOpen)
    setOpen(newOpen)
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("IR Button clicked")
    setOpen(true)
  }

  if (!isUserOnTeam || matches.length === 0) {
    return null
  }

  if (checkingIR) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking...
      </Button>
    )
  }

  if (existingIR) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
          <Heart className="h-4 w-4" />
          On Injury Reserve
        </span>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleButtonClick}>
          <Heart className="h-4 w-4 mr-2" />
          Request IR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Injury Reserve</DialogTitle>
          <DialogDescription>
            Request injury reserve for this entire week. This will apply to all games during this week.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Brief description of injury or reason for IR..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmitIR} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit IR Request"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
