"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useSupabase } from "@/lib/supabase/client"
import { Code } from "@/components/ui/code"

export default function AwardsPageDebugPage() {
  const { supabase } = useSupabase()
  const [playerAwards, setPlayerAwards] = useState<any[]>([])
  const [teamAwards, setTeamAwards] = useState<any[]>([])
  const [seasons, setSeasons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch team awards
        const { data: teamAwardsData, error: teamAwardsError } = await supabase
          .from("team_awards")
          .select(`
            id,
            team_id,
            teams:team_id (name, logo_url),
            award_type,
            season_number,
            year,
            description
          `)
          .order("year", { ascending: false })
          .order("season_number", { ascending: false })
          .limit(10)

        if (teamAwardsError) throw teamAwardsError
        setTeamAwards(teamAwardsData || [])

        // Fetch player awards with team info
        const { data: playerAwardsData, error: playerAwardsError } = await supabase
          .from("player_awards")
          .select(`
            id,
            player_id,
            players:player_id (
              users:user_id (gamer_tag_id),
              team_id,
              teams:team_id (name, logo_url)
            ),
            award_type,
            season_number,
            year,
            description
          `)
          .order("year", { ascending: false })
          .order("season_number", { ascending: false })
          .limit(10)

        if (playerAwardsError) throw playerAwardsError
        setPlayerAwards(playerAwardsData || [])

        // Fetch seasons
        const { data: seasonsData, error: seasonsError } = await supabase
          .from("seasons")
          .select("id, name, number")
          .order("id")

        if (seasonsError) {
          console.error("Error fetching seasons:", seasonsError)
        } else {
          setSeasons(seasonsData || [])
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setError(error.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Awards Page Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Seasons Data</CardTitle>
            <CardDescription>Data from the seasons table</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-md p-4 overflow-auto max-h-[400px]">
              <Code>
                <pre>{JSON.stringify(seasons, null, 2)}</pre>
              </Code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Awards Data</CardTitle>
            <CardDescription>First 10 player awards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-md p-4 overflow-auto max-h-[400px]">
              <Code>
                <pre>{JSON.stringify(playerAwards, null, 2)}</pre>
              </Code>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Team Awards Data</CardTitle>
            <CardDescription>First 10 team awards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-md p-4 overflow-auto max-h-[400px]">
              <Code>
                <pre>{JSON.stringify(teamAwards, null, 2)}</pre>
              </Code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
