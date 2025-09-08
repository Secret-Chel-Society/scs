"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ConferenceList } from "@/components/admin/conference-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AdminConferencesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    } else if (status === "authenticated" && session?.user.role !== "admin") {
      router.push("/")
    }
  }, [status, session, router])

  if (status === "loading" || status === "unauthenticated") {
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
