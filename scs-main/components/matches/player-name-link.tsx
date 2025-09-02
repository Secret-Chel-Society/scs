"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase/client"

interface PlayerNameLinkProps {
  playerName: string
  className?: string
}

export function PlayerNameLink({ playerName, className }: PlayerNameLinkProps) {
  const { supabase } = useSupabase()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const checkPlayerExists = async () => {
      try {
        setIsLoading(true)

        // First check if there's a direct match with a user's gamer tag
        const { data: userData, error: userError } = await supabase
          .from("auth.users")
          .select("id")
          .eq("gamer_tag", playerName)
          .limit(1)

        if (userData && userData.length > 0) {
          setUserId(userData[0].id)
          return
        }

        // If no direct match, check the players table
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("user_id")
          .ilike("player_name", playerName)
          .limit(1)

        if (playerData && playerData.length > 0 && playerData[0].user_id) {
          setUserId(playerData[0].user_id)
          return
        }
      } catch (error) {
        console.error("Error checking player:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkPlayerExists()
  }, [playerName, supabase])

  if (isLoading) {
    return <span className={className}>{playerName}</span>
  }

  if (!userId) {
    return <span className={className}>{playerName}</span>
  }

  return (
    <Link href={`/profile/${userId}`} className={`${className} text-primary hover:underline cursor-pointer`}>
      {playerName}
    </Link>
  )
}
