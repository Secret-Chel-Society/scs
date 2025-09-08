"use client"

import type React from "react"

import { createClient as createBrowserClient } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "../types/database"
import type { Session } from "@supabase/supabase-js"
import { createCustomClient } from "./custom-client"

type SupabaseContext = {
  supabase: SupabaseClient<Database>
  session: Session | null
  isLoading: boolean
  refreshSession: () => Promise<void>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [supabase] = useState(() => createCustomClient())
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error("Error refreshing session:", error)
        throw error
      } else {
        setSession(data.session)
      }
    } catch (err) {
      console.error("Unexpected error refreshing session:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      setIsLoading(true)
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (mounted) {
          setSession(initialSession)
        }
      } catch (err) {
        console.error("Error getting session:", err)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession(currentSession)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return <Context.Provider value={{ supabase, session, isLoading, refreshSession }}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: useUser – returns an object with { user } for easy destructuring
// ─────────────────────────────────────────────────────────────────────────────
import type { User } from "@supabase/supabase-js"

/**
 * useUser
 *
 * Returns the authenticated Supabase user (or null) wrapped in an object
 * so callers can safely destructure:  const { user } = useUser()
 */
export function useUser(): { user: User | null } {
  const { session } = useSupabase()
  return { user: session?.user ?? null }
}

export function createClient(cookieStore: any = null) {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore?.get(name)?.value
        },
      },
    },
  )
}
