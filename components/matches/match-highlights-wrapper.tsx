"use client"

import { useState, useEffect } from "react"
import { MatchHighlights } from "./match-highlights"
import { HighlightsStatusChecker } from "./highlights-status-checker"
import { useSupabase } from "@/lib/supabase/client"

interface MatchHighlightsWrapperProps {
  matchId: string
  canEdit: boolean
  className?: string
}

export function MatchHighlightsWrapper({ matchId, canEdit, className }: MatchHighlightsWrapperProps) {
  const { supabase, session } = useSupabase()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!session?.user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id)

        if (error) {
          console.error("Error checking admin status:", error)
          setIsAdmin(false)
        } else {
          setIsAdmin(data?.some((role) => role.role === "admin") || false)
        }
      } catch (error) {
        console.error("Error:", error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [session, supabase])

  if (loading) {
    return null
  }

  return (
    <>
      <HighlightsStatusChecker isAdmin={isAdmin} />
      <MatchHighlights matchId={matchId} canEdit={canEdit} className={className} />
    </>
  )
}
