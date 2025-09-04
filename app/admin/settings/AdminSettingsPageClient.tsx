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
import { Settings, Shield, Users, Database, Trophy, Activity } from "lucide-react"
// import { motion } from "framer-motion"

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
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ice-blue-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-bold mb-8 text-hockey-silver-900 dark:text-hockey-silver-100 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            Admin Settings
          </h1>

          <Tabs defaultValue="bidding" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-3xl gap-2 p-2 bg-hockey-silver-100 dark:bg-hockey-silver-800 rounded-xl">
              <TabsTrigger 
                value="bidding" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-hockey-silver-200 dark:hover:bg-hockey-silver-700 transition-all duration-200"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Bidding
              </TabsTrigger>
              <TabsTrigger 
                value="ip-tracking" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-hockey-silver-200 dark:hover:bg-hockey-silver-700 transition-all duration-200"
              >
                <Activity className="mr-2 h-4 w-4" />
                IP Tracking
              </TabsTrigger>
              <TabsTrigger 
                value="user-bids" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-hockey-silver-200 dark:hover:bg-hockey-silver-700 transition-all duration-200"
              >
                <Users className="mr-2 h-4 w-4" />
                User Bids
              </TabsTrigger>
              <TabsTrigger 
                value="seasons" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-hockey-silver-200 dark:hover:bg-hockey-silver-700 transition-all duration-200"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Seasons
              </TabsTrigger>
              <TabsTrigger 
                value="diagnostics" 
                className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:bg-hockey-silver-200 dark:hover:bg-hockey-silver-700 transition-all duration-200"
              >
                <Database className="mr-2 h-4 w-4" />
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
