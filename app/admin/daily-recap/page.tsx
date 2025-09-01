"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import DailyRecap from "@/components/admin/daily-recap"
import DailyRecapsTableMigration from "@/components/admin/daily-recaps-table-migration"
import { ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
        <CardContent className="p-6">
          <Skeleton className="h-8 w-64 mb-2 bg-slate-700" />
          <Skeleton className="h-4 w-96 mb-4 bg-slate-700" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-slate-700" />
            <Skeleton className="h-10 w-32 bg-slate-700" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DailyRecapPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if user is admin
  useEffect(() => {
    async function checkAuthAndLoadData() {
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
        setLoading(true)

        // Check for Admin role
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin panel.",
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

    checkAuthAndLoadData()
  }, [supabase, session, toast, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-64 mb-2 bg-slate-700" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-5 w-5 text-white/70" />
            <Link href="/admin" className="text-white/70 hover:text-white transition-colors">
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Daily Recap Management
              </h1>
              <p className="text-white/70 mt-1">Generate and manage daily recaps for recent matches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="space-y-6">
          <DailyRecapsTableMigration />

          <DailyRecap />
        </div>
      </div>
    </div>
  )
}
