"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink } from "lucide-react"

interface PlayerClickableLinkProps {
  playerName: string
  className?: string
}

export function PlayerClickableLink({ playerName, className }: PlayerClickableLinkProps) {
  const { supabase } = useSupabase()
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [notFound, setNotFound] = useState<boolean>(false)

  useEffect(() => {
    const findPlayerByName = async () => {
      try {
        setIsLoading(true)
        setNotFound(false)

        if (!playerName || playerName === "Unknown Player") {
          setNotFound(true)
          return
        }

        console.log(`Searching for player with name: ${playerName}`)

        // First try to find the player by exact gamer_tag match
        const { data: exactMatch, error: exactMatchError } = await supabase
          .from("users")
          .select("id, gamer_tag_id")
          .eq("gamer_tag_id", playerName)
          .limit(1)

        if (exactMatch && exactMatch.length > 0) {
          console.log(`Found exact match for ${playerName}:`, exactMatch[0])

          // Now get the player ID from the players table
          const { data: playerData } = await supabase
            .from("players")
            .select("id")
            .eq("user_id", exactMatch[0].id)
            .limit(1)

          if (playerData && playerData.length > 0) {
            setPlayerId(playerData[0].id)
            return
          }
        }

        // If no exact match, try a case-insensitive search
        const { data: caseInsensitiveMatch, error: caseInsensitiveError } = await supabase
          .from("users")
          .select("id, gamer_tag_id")
          .ilike("gamer_tag_id", `%${playerName}%`)
          .limit(1)

        if (caseInsensitiveMatch && caseInsensitiveMatch.length > 0) {
          console.log(`Found case-insensitive match for ${playerName}:`, caseInsensitiveMatch[0])

          // Now get the player ID from the players table
          const { data: playerData } = await supabase
            .from("players")
            .select("id")
            .eq("user_id", caseInsensitiveMatch[0].id)
            .limit(1)

          if (playerData && playerData.length > 0) {
            setPlayerId(playerData[0].id)
            return
          }
        }

        // If still no match, try to find by similar name in season_registrations
        const { data: registrationMatch, error: registrationError } = await supabase
          .from("season_registrations")
          .select("user_id, gamer_tag")
          .ilike("gamer_tag", `%${playerName}%`)
          .limit(1)

        if (registrationMatch && registrationMatch.length > 0) {
          console.log(`Found registration match for ${playerName}:`, registrationMatch[0])

          // Now get the player ID from the players table
          const { data: playerData } = await supabase
            .from("players")
            .select("id")
            .eq("user_id", registrationMatch[0].user_id)
            .limit(1)

          if (playerData && playerData.length > 0) {
            setPlayerId(playerData[0].id)
            return
          }
        }

        // If we still haven't found a match, check if there's a mapping in ea_player_mappings table
        // This would be a table you could create to manually map EA names to player IDs
        const { data: mappingMatch, error: mappingError } = await supabase
          .from("ea_player_mappings")
          .select("player_id")
          .eq("persona", playerName)
          .limit(1)

        if (mappingMatch && mappingMatch.length > 0) {
          console.log(`Found mapping for ${playerName}:`, mappingMatch[0])
          setPlayerId(mappingMatch[0].player_id)
          return
        }

        // If we get here, we couldn't find a match
        console.log(`No match found for player: ${playerName}`)
        setNotFound(true)
      } catch (error) {
        console.error("Error finding player:", error)
        setNotFound(true)
      } finally {
        setIsLoading(false)
      }
    }

    findPlayerByName()
  }, [playerName, supabase])

  if (isLoading) {
    return <Skeleton className={`h-4 w-24 ${className}`} />
  }

  if (notFound || !playerId) {
    return (
      <span className={`${className} flex items-center`}>
        {playerName}
        <span className="ml-1 text-xs text-muted-foreground">(No profile)</span>
      </span>
    )
  }

  return (
    <Link href={`/players/${playerId}`} className={`${className} text-primary hover:underline flex items-center`}>
      {playerName}
      <ExternalLink className="h-3 w-3 ml-1" />
    </Link>
  )
}
