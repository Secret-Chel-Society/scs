"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { LineupManager } from "@/components/admin/lineup-manager"
import { LineupsMigration } from "@/components/admin/lineups-migration"

export default function ManageMatchLineupsPage() {
  const params = useParams()
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tableExists, setTableExists] = useState(true)
  const matchId = params.id as string

  useEffect(() => {
    async function checkAuth() {
      if (!session?.user) {
        toast({
          title: "Unauthorized",
          description: "You must be logged in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      try {
        // Check for admin role
        const { data: userRoles, error: rolesError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (rolesError || !userRoles || userRoles.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to manage lineups.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)

        // Check if lineups table exists
        try {
          // Try to query the lineups table
          await supabase.from("lineups").select("count").limit(1)
          setTableExists(true)
        } catch (error) {
          console.error("Lineups table may not exist:", error)
          setTableExists(false)
        }
      } catch (error: any) {
        console.error("Error checking authorization:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, session, toast, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Manage Match Lineups</h1>
      </div>

      {!tableExists ? (
        <div className="mb-8">
          <LineupsMigration />
        </div>
      ) : (
        <LineupManager matchId={matchId} />
      )}
    </div>
  )
}
