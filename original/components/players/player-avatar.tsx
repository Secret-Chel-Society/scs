"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { avatarSync } from "@/lib/avatar-sync"

interface PlayerAvatarProps {
  userId: string
  playerName: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-20 w-20 text-lg",
}

export function PlayerAvatar({ userId, playerName, size = "md", className = "" }: PlayerAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Fetch user avatar
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("users").select("avatar_url").eq("id", userId).single()

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
  }, [userId, supabase])

  // Subscribe to avatar updates for this specific user
  useEffect(() => {
    if (!userId) return

    const unsubscribe = avatarSync.subscribe((newAvatarUrl) => {
      // Only update if this is for the current user
      setAvatarUrl(newAvatarUrl)
    })

    return unsubscribe
  }, [userId])

  // Generate initials fallback
  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const sizeClass = sizeClasses[size]

  if (loading) {
    return <div className={`${sizeClass} rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse ${className}`} />
  }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl || "/placeholder.svg"}
        alt={playerName}
        className={`${sizeClass} rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 ${className}`}
        onError={() => setAvatarUrl(null)} // Fallback to initials on error
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${className}`}
    >
      {getInitials(playerName)}
    </div>
  )
}
