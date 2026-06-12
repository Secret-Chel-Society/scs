"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { LeagueSettings } from "@/components/admin/league-settings"
import { AdminDiagnostics } from "@/components/admin/admin-diagnostics"
import { RemoveUserBids } from "@/components/admin/remove-user-bids"
import { IpTracking } from "@/components/admin/ip-tracking"
import { SeasonsManager } from "@/components/admin/seasons-manager"
import { FineManagement } from "@/components/admin/fine-management"

export function AdminSettingsPageClient() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase, session } = useSupabase()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSiteOwner, setIsSiteOwner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuthorization() {
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
        // Check for Admin role
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        // Check for Site Owner role
        const { data: siteOwnerData } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Site Owner")

        if (adminRoleError || (!adminRoleData?.length && !siteOwnerData?.length)) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin settings.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(adminRoleData && adminRoleData.length > 0)
        setIsSiteOwner(siteOwnerData && siteOwnerData.length > 0)
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

    checkAuthorization()
  }, [supabase, session, toast, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!isAdmin && !isSiteOwner) {
    return null
  }

  // Calculate grid columns based on whether IP Tracking is shown
  const tabCount = isSiteOwner ? 6 : 5

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Settings</h1>

      <Tabs defaultValue="leagues" className="space-y-6">
        <TabsList className={`grid w-full max-w-4xl`} style={{ gridTemplateColumns: `repeat(${tabCount}, 1fr)` }}>
          <TabsTrigger value="leagues">NHL / AHL</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
          {isSiteOwner && <TabsTrigger value="ip-tracking">IP Tracking</TabsTrigger>}
          <TabsTrigger value="user-bids">User Bids</TabsTrigger>
          <TabsTrigger value="seasons">Seasons</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="leagues">
          <LeagueSettings />
        </TabsContent>

        <TabsContent value="fines">
          <FineManagement />
        </TabsContent>

        {isSiteOwner && (
          <TabsContent value="ip-tracking">
            <IpTracking />
          </TabsContent>
        )}

        <TabsContent value="user-bids">
          <RemoveUserBids />
        </TabsContent>

        <TabsContent value="seasons">
          <SeasonsManager />
        </TabsContent>

        <TabsContent value="diagnostics">
          <AdminDiagnostics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
