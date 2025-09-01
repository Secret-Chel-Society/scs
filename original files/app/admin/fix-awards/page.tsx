"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { FixAwardSeasons } from "@/components/admin/fix-award-seasons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export default function FixAwardsPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [teamAwards, setTeamAwards] = useState<any[]>([])

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
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin dashboard.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)
        fetchData()
      } catch (error: any) {
        console.error("Error checking authorization:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      }
    }

    checkAuthorization()
  }, [supabase, session, toast, router])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch team awards
      const { data: teamAwardsData, error: teamAwardsError } = await supabase
        .from("team_awards")
        .select(`
          id,
          team_id,
          teams:team_id (name),
          award_type,
          season_number,
          year,
          description,
          created_at
        `)
        .order("year", { ascending: false })
        .order("season_number", { ascending: false })

      if (teamAwardsError) throw teamAwardsError

      const formattedTeamAwards = teamAwardsData.map((award) => ({
        id: award.id,
        team_id: award.team_id,
        team_name: award.teams?.name || "Unknown Team",
        award_type: award.award_type,
        season_number: award.season_number,
        year: award.year,
        description: award.description,
        created_at: award.created_at,
      }))

      setTeamAwards(formattedTeamAwards || [])
    } catch (error: any) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fix Award Issues</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <FixAwardSeasons />

        <Card>
          <CardHeader>
            <CardTitle>Award Seasons Debug</CardTitle>
            <CardDescription>View current award season values</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchData} className="mb-4">
              Refresh Data
            </Button>
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Award</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamAwards.length > 0 ? (
                    teamAwards.map((award) => (
                      <TableRow key={award.id}>
                        <TableCell className="font-mono text-xs">{award.id}</TableCell>
                        <TableCell>{award.award_type}</TableCell>
                        <TableCell>{award.team_name}</TableCell>
                        <TableCell>{award.season_number}</TableCell>
                        <TableCell>{award.year}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No team awards found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
