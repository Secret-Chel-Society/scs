"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { BiddingSettings } from "@/components/admin/bidding-settings"
import { BidProcessor } from "@/components/admin/bid-processor"
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
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <h1 className="hockey-title mb-6">
              System Settings
            </h1>
            <p className="hockey-subtitle mx-auto mb-8">
              Configure and manage all system settings, bidding parameters, and administrative controls
            </p>
            
            {/* Admin Status Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white px-6 py-3 rounded-full shadow-lg shadow-assist-green-500/25 border-2 border-white dark:border-hockey-silver-800">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">Administrator Access Granted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="animate-fade-in-up">

          <Tabs defaultValue="bidding" className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-6 w-full max-w-5xl gap-3 p-2 bg-gradient-to-r from-ice-blue-100/80 to-rink-blue-100/80 dark:from-ice-blue-900/40 dark:to-rink-blue-900/40 rounded-2xl border-2 border-ice-blue-200/60 dark:border-rink-blue-700/60 shadow-xl backdrop-blur-sm">
                <TabsTrigger 
                  value="bidding" 
                  className="px-6 py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 font-semibold text-lg"
                >
                  <Shield className="h-5 w-5" />
                  Bidding
                </TabsTrigger>
                <TabsTrigger 
                  value="bid-processor" 
                  className="px-6 py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 font-semibold text-lg"
                >
                  <Trophy className="h-5 w-5" />
                  Process Bids
                </TabsTrigger>
                <TabsTrigger 
                  value="ip-tracking" 
                  className="px-6 py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 font-semibold text-lg"
                >
                  <Activity className="h-5 w-5" />
                  IP Tracking
                </TabsTrigger>
                <TabsTrigger 
                  value="user-bids" 
                  className="px-6 py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 font-semibold text-lg"
                >
                  <Users className="h-5 w-5" />
                  User Bids
                </TabsTrigger>
                <TabsTrigger 
                  value="seasons" 
                  className="px-6 py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 font-semibold text-lg"
                >
                  <Trophy className="h-5 w-5" />
                  Seasons
                </TabsTrigger>
                <TabsTrigger 
                  value="diagnostics" 
                  className="px-6 py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 font-semibold text-lg"
                >
                  <Database className="h-5 w-5" />
                  Diagnostics
                </TabsTrigger>
              </TabsList>
            </div>

        <TabsContent value="bidding">
          <BiddingSettings />
        </TabsContent>

        <TabsContent value="bid-processor">
          <BidProcessor />
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
      </div>
    </div>
  )
}
