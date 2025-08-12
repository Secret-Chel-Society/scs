"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { avatarSync } from "@/lib/avatar-sync"

interface PlayerCardProps {
  player: {
    id: string
    name: string
    position: string
    secondaryPosition?: string
    console: string
    salary: number
    user_id?: string // Add user_id to fetch avatar
  }
}

export function PlayerCard({ player }: PlayerCardProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Fetch user avatar
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!player.user_id) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("users").select("avatar_url").eq("id", player.user_id).single()

        if (!error && data) {
          setAvatarUrl(data.avatar_url)
        }
      } catch (error) {
        console.error("Error fetching player avatar:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvatar()
  }, [player.user_id, supabase])

  // Subscribe to avatar updates
  useEffect(() => {
    if (!player.user_id) return

    const unsubscribe = avatarSync.subscribe((newAvatarUrl) => {
      setAvatarUrl(newAvatarUrl)
    })

    return unsubscribe
  }, [player.user_id])

  // Generate initials fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-4">
      {/* Player Avatar and Name */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          {loading ? (
            <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
          ) : avatarUrl ? (
            <img
              src={avatarUrl || "/placeholder.svg"}
              alt={player.name}
              className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              onError={() => setAvatarUrl(null)} // Fallback to initials on error
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {getInitials(player.name)}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{player.name}</h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span className="font-medium text-blue-400">({player.position})</span>
            {player.secondaryPosition && (
              <>
                <span>/</span>
                <span className="font-medium text-green-400">({player.secondaryPosition})</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Player Details */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Console:</span>
          <span className="text-sm font-medium">{player.console}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Salary:</span>
          <span className="text-sm font-medium">${player.salary.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
