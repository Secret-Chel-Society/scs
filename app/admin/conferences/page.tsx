"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ConferenceList } from "@/components/admin/conference-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AdminConferencesPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/signin")
        return
      }

      // Check if user has admin role
      const { data: userData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (userData?.role !== "admin") {
        router.push("/")
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Conferences</h1>
        <p className="text-muted-foreground">
          Manage league conferences and their assignments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conference Management</CardTitle>
          <CardDescription>
            Create, edit, and manage conferences for your league
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConferenceList />
        </CardContent>
      </Card>
    </div>
  )
}
