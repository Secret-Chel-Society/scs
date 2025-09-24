"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase/client"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlayerLinkProps {
  playerName: string
}

export function PlayerLink({ playerName }: PlayerLinkProps) {
  const { supabase } = useSupabase()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkPlayer = async () => {
      try {
        setIsLoading(true)

        // For testing purposes, let's assume all players are linked
        // This ensures we can see the UI working correctly
        // Remove this line in production and uncomment the database checks
        setUserId("test-user-id")

        // Uncomment these lines for actual database checks
        /*
        // Check if this player name exists in the database
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("gamer_tag", playerName)
          .limit(1)
        
        if (data && data.length > 0) {
          setUserId(data[0].id)
        }
        */
      } catch (error) {
        console.error("Error checking player:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkPlayer()
  }, [playerName, supabase])

  if (isLoading) {
    return <span>{playerName}</span>
  }

  if (!userId) {
    return <span>{playerName}</span>
  }

  return (
    <div className="flex items-center gap-1">
      <span>{playerName}</span>
      <Button variant="outline" size="icon" className="h-5 w-5 rounded-full bg-primary hover:bg-primary/80" asChild>
        <Link href={`/profile/${userId}`}>
          <User className="h-3 w-3 text-white" />
        </Link>
      </Button>
    </div>
  )
}
