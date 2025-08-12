"use client"

import { useState, useEffect } from "react"
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

  useEffect(() => {
    if (session?.user) {
      fetchTeamInfo()
    } else {
      setIsLoading(false)
    }
  }, [session, supabase])

  const fetchTeamInfo = async () => {
    try {
      setIsLoading(true)
      console.log("=== TEAM CHAT BUTTON DEBUG ===")
      console.log("Session:", !!session, session?.user?.id)

      if (!session?.user?.id) {
        console.log("No session or user ID")
        setIsLoading(false)
        return
      }

      // Get player data with simplified query
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("team_id")
        .eq("user_id", session.user.id)
        .maybeSingle()

      console.log("Player query result:", { playerData, playerError })

      if (playerError) {
        console.error("Error fetching player:", playerError)
        setIsLoading(false)
        return
      }

      if (!playerData?.team_id) {
        console.log("No team found for user")
        setIsLoading(false)
        return
      }

      // Get team data with simplified query
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, name, logo_url")
        .eq("id", playerData.team_id)
        .maybeSingle()

      console.log("Team query result:", { teamData, teamError })

      if (teamError) {
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
        console.log("Team info set:", teamData)
      } else {
        console.log("No team data found")
      }
    } catch (error) {
      console.error("Error in fetchTeamInfo:", error)
    } finally {
      setIsLoading(false)
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
