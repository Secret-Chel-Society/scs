"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Award, Bug, Database } from "lucide-react"

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center">
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Access Denied</h1>
            <p className="text-white/70">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-400" />
            Awards Table Debug
          </h1>
          <p className="text-white/70 text-lg">
            Debug and inspect the player awards table structure and data
          </p>
        </div>

        <div className="mb-8">
          <Button 
            onClick={fetchAwardsInfo} 
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? "Loading..." : "Fetch Awards Info"}
          </Button>
        </div>

        {tableInfo && (
          <Card className="mb-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-400" />
                Table Structure
              </CardTitle>
              <CardDescription className="text-white/70">Columns in the player_awards table</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-800/50 p-4 rounded-md overflow-x-auto border border-white/20">
                <pre className="text-sm text-white">{JSON.stringify(tableInfo, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {awards.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bug className="h-5 w-5 text-green-400" />
                Sample Awards
              </CardTitle>
              <CardDescription className="text-white/70">Up to 10 awards from the database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-800/50 p-4 rounded-md overflow-x-auto border border-white/20">
                <pre className="text-sm text-white">{JSON.stringify(awards, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
