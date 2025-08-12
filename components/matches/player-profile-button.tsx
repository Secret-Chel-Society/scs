"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

interface PlayerProfileButtonProps {
  playerName: string
  className?: string
}

export function PlayerProfileButton({ playerName, className }: PlayerProfileButtonProps) {
  const { supabase } = useSupabase()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const checkPlayerExists = async () => {
      try {
        setIsLoading(true)

        // Try to find the player by name in the users table by gamer_tag
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("gamer_tag", playerName)
          .limit(1)

        if (userData && userData.length > 0) {
          setUserId(userData[0].id)
          return
        }

        // If not found, try the players table
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

  if (isLoading || !userId) {
    return null
  }

  return (
    <Link href={`/profile/${userId}`} className={className}>
      <Button variant="ghost" size="sm" className="p-1 h-auto">
        <User className="h-4 w-4" />
      </Button>
    </Link>
  )
}
