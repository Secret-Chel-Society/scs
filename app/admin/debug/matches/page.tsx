"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/team-logo"
import Link from "next/link"

export default function DebugMatchesPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [columnInfo, setColumnInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true)
        const response = await fetch("/api/debug/all-matches")

        if (!response.ok) {
          throw new Error("Failed to fetch matches")
        }

        const data = await response.json()
        setMatches(data.matches || [])
        setColumnInfo(data.columnInfo)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load matches",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [toast])

  const updateSeasonName = async (matchId: string) => {
    try {
      const response = await fetch(`/api/admin/update-season-name?matchId=${matchId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to update season name")
      }

      toast({
        title: "Success",
        description: "Season name updated successfully",
      })

      // Refresh matches
      const refreshResponse = await fetch("/api/debug/all-matches")
      const data = await refreshResponse.json()
      setMatches(data.matches || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update season name",
        variant: "destructive",
      })
    }
  }

  const updateAllSeasonNames = async () => {
    try {
      setUpdating(true)
      const response = await fetch("/api/admin/update-all-season-names", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to update all season names")
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: data.message || "All season names updated successfully",
      })

      // Refresh matches
      const refreshResponse = await fetch("/api/debug/all-matches")
      const refreshData = await refreshResponse.json()
      setMatches(refreshData.matches || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update all season names",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Debug Matches</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Database Information</CardTitle>
          <CardDescription>Information about the matches table structure</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Season ID Column Type:</h3>
                <p>{columnInfo || "Unknown"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Total Matches:</h3>
                <p>{matches.length}</p>
              </div>
              <div className="pt-4">
                <Button onClick={updateAllSeasonNames} disabled={updating}>
                  {updating ? "Updating..." : "Update All Season Names"}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This will update the season_name field for all matches based on their season_id.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Matches</CardTitle>
          <CardDescription>Showing up to 100 most recent matches</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Season ID</TableHead>
                    <TableHead>Season Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-mono text-xs">{match.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TeamLogo teamName={match.home_team?.name || "Unknown"} size="xs" />
                          <span>{match.home_team?.name || "Unknown"}</span>
                          <span className="mx-1">vs</span>
                          <TeamLogo teamName={match.away_team?.name || "Unknown"} size="xs" />
                          <span>{match.away_team?.name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {match.home_score !== null && match.away_score !== null
                          ? `${match.home_score} - ${match.away_score}`
                          : "Not played"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            match.status === "completed" || match.status === "Completed" ? "success" : "secondary"
                          }
                        >
                          {match.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {match.season_id !== null ? match.season_id : "null"}
                      </TableCell>
                      <TableCell>{match.season_name || "Not set"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/matches/${match.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => updateSeasonName(match.id)}>
                            Update Season Name
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
