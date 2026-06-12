"use client"

import { useEffect, useState } from "react"
import { User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface OnlineMember {
  id: string
  gamer_tag_id: string
  avatar_url: string | null
}

export function MembersOnline() {
  const { user } = useAuth()
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch online members and track current user activity
  useEffect(() => {
    let mounted = true
    
    async function fetchAndTrack() {
      try {
        // Always fetch online members, pass userId if available
        const response = await fetch("/api/online-members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id || null }),
        })
        if (response.ok && mounted) {
          const data = await response.json()
          setOnlineMembers(data.members || [])
        }
      } catch (error) {
        console.error("Failed to fetch online members:", error)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    // Fetch immediately
    fetchAndTrack()

    // Poll every 30 seconds
    const interval = setInterval(fetchAndTrack, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [user?.id])

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Members Online
        </h4>
        <span className="text-xs text-muted-foreground">{onlineMembers.length} online</span>
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
      ) : onlineMembers.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {onlineMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="relative">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.gamer_tag_id}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-background"></span>
              </div>
              <span className="text-xs font-medium truncate">{member.gamer_tag_id}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">No members online</p>
      )}
    </div>
  )
}
