"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

// Track user activity (update last_login_at)
async function trackUserActivity(userId: string) {
  try {
    await fetch("/api/track-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
  } catch (e) {
    // Silently fail - don't disrupt user experience
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const lastTrackRef = useRef<number>(0)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Get initial user - use getUser() which is more reliable than getSession()
    supabase.auth.getUser().then(({ data: { user: authUser }, error }) => {
      setUser(authUser ?? null)
      setLoading(false)
      
      // Track activity on initial load if user is logged in
      if (authUser?.id) {
        trackUserActivity(authUser.id)
        lastTrackRef.current = Date.now()
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Track activity when auth state changes to signed in
      if (session?.user?.id) {
        trackUserActivity(session.user.id)
        lastTrackRef.current = Date.now()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Periodic heartbeat to keep user marked as online (every 5 minutes)
  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      const now = Date.now()
      // Only track if more than 5 minutes since last track
      if (now - lastTrackRef.current >= 5 * 60 * 1000) {
        trackUserActivity(user.id)
        lastTrackRef.current = now
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [user?.id])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
