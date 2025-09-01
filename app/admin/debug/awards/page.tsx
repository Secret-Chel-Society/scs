"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function DebugAwardsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [awards, setAwards] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdminStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single()

        setIsAdmin(!!data)
      }
    }

    checkAdminStatus()
  }, [supabase])

  async function fetchAwardsInfo() {
    try {
      setLoading(true)

      // First, let's get table information
      const { data: tableData, error: tableError } = await supabase.rpc("get_table_info", {
        table_name: "player_awards",
      })

      if (tableError) {
        console.error("Error fetching table info:", tableError)
        // Try a simpler approach
        const { data: sampleData, error: sampleError } = await supabase
          .from("player_awards")
          .select("*")
          .limit(1)
          .single()

        if (sampleError && sampleError.code !== "PGRST116") {
          console.error("Error fetching sample award:", sampleError)
        } else {
          console.log("Sample award data:", sampleData)
          setTableInfo(sampleData ? Object.keys(sampleData).map((key) => ({ column_name: key })) : [])
        }
      } else {
        console.log("Table info:", tableData)
        setTableInfo(tableData)
      }

      // Now fetch some awards
      const { data: awardsData, error: awardsError } = await supabase.from("player_awards").select("*").limit(10)

      if (awardsError) {
        console.error("Error fetching awards:", awardsError)
        throw awardsError
      }

      console.log("Awards data:", awardsData)
      setAwards(awardsData || [])

      toast({
        title: "Debug info loaded",
        description: "Awards table information has been loaded",
      })
    } catch (error: any) {
      console.error("Error in debug page:", error)
      toast({
        title: "Debug Error",
        description: error.message || "Failed to load debug information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Awards Table Debug</h1>

      <div className="mb-8">
        <Button onClick={fetchAwardsInfo} disabled={loading}>
          {loading ? "Loading..." : "Fetch Awards Info"}
        </Button>
      </div>

      {tableInfo && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Table Structure</CardTitle>
            <CardDescription>Columns in the player_awards table</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md overflow-x-auto">
              <pre className="text-sm">{JSON.stringify(tableInfo, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {awards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Awards</CardTitle>
            <CardDescription>Up to 10 awards from the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md overflow-x-auto">
              <pre className="text-sm">{JSON.stringify(awards, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
