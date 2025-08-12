"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { CheckCircle, AlertCircle } from "lucide-react"

export function AdminDiagnostics() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [databaseStatus, setDatabaseStatus] = useState<string | null>(null)
  const [storageStatus, setStorageStatus] = useState<string | null>(null)
  const [authStatus, setAuthStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSystemStatus() {
      try {
        setLoading(true)

        // Check database connection
        const { error: dbError } = await supabase.from("users").select("id").limit(1)
        setDatabaseStatus(dbError ? `Error: ${dbError.message}` : "Connected")

        // Check storage connection
        const { error: storageError } = await supabase.storage.listBuckets()
        setStorageStatus(storageError ? `Error: ${storageError.message}` : "Connected")

        // Check auth connection
        const { error: authError } = await supabase.auth.getUser()
        setAuthStatus(authError ? `Error: ${authError.message}` : "Connected")
      } catch (error: any) {
        console.error("Error checking system status:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to check system status",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkSystemStatus()
  }, [supabase, toast])

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Database</h3>
          <p className="text-sm text-muted-foreground">
            {databaseStatus === "Connected" ? (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="h-4 w-4" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-4 w-4" />
                {databaseStatus || "Unknown"}
              </span>
            )}
          </p>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Storage</h3>
          <p className="text-sm text-muted-foreground">
            {storageStatus === "Connected" ? (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="h-4 w-4" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-4 w-4" />
                {storageStatus || "Unknown"}
              </span>
            )}
          </p>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Authentication</h3>
          <p className="text-sm text-muted-foreground">
            {authStatus === "Connected" ? (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="h-4 w-4" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-4 w-4" />
                {authStatus || "Unknown"}
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdminDiagnostics
