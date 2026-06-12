"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { TeamChatModal } from "./team-chat-modal"
import { useSupabase } from "@/lib/supabase/client"

interface TeamInfo {
  id: string
  name: string
  logo_url?: string | null
}

export function TeamChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { supabase, session } = useSupabase()
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    if (session?.user) {
      fetchTeamInfo()
    } else {
      setIsLoading(false)
    }

    return () => {
      isMountedRef.current = false
    }
  }, [session?.user]) // Updated to use session?.user instead of session?.user?.id

  const fetchTeamInfo = async () => {
    try {
      setIsLoading(true)

      if (!session?.user?.id) {
        if (isMountedRef.current) setIsLoading(false)
        return
      }

      // Get player data with simplified query
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("team_id")
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (!isMountedRef.current) return

      if (playerError) {
        if (playerError.message?.includes("abort")) return
        console.error("Error fetching player:", playerError)
        setIsLoading(false)
        return
      }

      if (!playerData?.team_id) {
        setIsLoading(false)
        return
      }

      // Get team data with simplified query
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .eq("id", playerData.team_id)
        .maybeSingle()

      if (!isMountedRef.current) return

      if (teamError) {
        if (teamError.message?.includes("abort")) return
        console.error("Error fetching team:", teamError)
        setIsLoading(false)
        return
      }

      if (teamData) {
        setTeamInfo({
          id: teamData.id,
          name: teamData.name || "Unknown Team",
          logo_url: teamData.logo_url,
        })
      }
    } catch (error: any) {
      if (error?.name === "AbortError" || error?.message?.includes("abort")) {
        return
      }
      console.error("Error in fetchTeamInfo:", error)
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  // Don't render anything if no session
  if (!session?.user) {
    return null
  }

  // Show loading state
  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <MessageCircle className="h-4 w-4 animate-pulse" />
      </Button>
    )
  }

  // Show debug button in development
  if (process.env.NODE_ENV === "development" && !teamInfo) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          console.log("=== DEBUG TEAM CHAT ===")
          console.log("Session:", session)
          console.log("Team Info:", teamInfo)
          fetchTeamInfo()
        }}
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    )
  }

  // Don't render if no team
  if (!teamInfo) {
    return null
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        <MessageCircle className="h-4 w-4" />
      </Button>

      <TeamChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        teamId={teamInfo.id}
        teamName={teamInfo.name}
        teamLogo={teamInfo.logo_url}
      />
    </>
  )
}
