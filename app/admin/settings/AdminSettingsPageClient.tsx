"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { BiddingSettings } from "@/components/admin/bidding-settings"
import { AdminDiagnostics } from "@/components/admin/admin-diagnostics"
import { RemoveUserBids } from "@/components/admin/remove-user-bids"
import { IpTracking } from "@/components/admin/ip-tracking"
import { SeasonsManager } from "@/components/admin/seasons-manager"
import { Settings, Gavel, MapPin, Users, Calendar, Bug } from "lucide-react"

export function AdminSettingsPageClient() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase, session } = useSupabase()
  const [isAdmin, setIsAdmin] = useState(false)
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
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (roleError || !roleData || roleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin settings.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-400" />
            Admin Settings
          </h1>
          <p className="text-white/70 text-lg">
            Manage system settings and configurations
          </p>
        </div>

        <Tabs defaultValue="bidding" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl bg-slate-800/50 border border-white/20">
            <TabsTrigger value="bidding" className="text-white data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Bidding
            </TabsTrigger>
            <TabsTrigger value="ip-tracking" className="text-white data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              IP Tracking
            </TabsTrigger>
            <TabsTrigger value="user-bids" className="text-white data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Bids
            </TabsTrigger>
            <TabsTrigger value="seasons" className="text-white data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Seasons
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="text-white data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Diagnostics
            </TabsTrigger>
          </TabsList>

        <TabsContent value="bidding">
          <BiddingSettings />
        </TabsContent>

        <TabsContent value="ip-tracking">
          <IpTracking />
        </TabsContent>

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
