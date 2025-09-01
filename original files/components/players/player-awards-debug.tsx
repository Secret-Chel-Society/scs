"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabase } from "@/lib/supabase/client"
import { Code } from "@/components/ui/code"

interface PlayerAwardsDebugProps {
  playerId: string
}

export function PlayerAwardsDebug({ playerId }: PlayerAwardsDebugProps) {
  const { supabase } = useSupabase()
  const [playerAwards, setPlayerAwards] = useState<any[]>([])
  const [awardsPageData, setAwardsPageData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch player awards with all columns
        const { data: awardsData, error: awardsError } = await supabase
          .from("player_awards")
          .select("*")
          .eq("player_id", playerId)

        if (awardsError) {
          console.error("Error fetching player awards:", awardsError)
          throw awardsError
        }

        setPlayerAwards(awardsData || [])

        // Fetch the same data using the awards page query structure
        // This helps us compare what the awards page is seeing vs. what we're seeing
        const { data: pageData, error: pageError } = await supabase
          .from("player_awards")
          .select(`
            id,
            player_id,
            award_type,
            season_number,
            year,
            description
          `)
          .eq("player_id", playerId)
          .order("year", { ascending: false })
          .order("season_number", { ascending: false })

        if (pageError) {
          console.error("Error fetching awards page data:", pageError)
        } else {
          setAwardsPageData(pageData || [])
        }
      } catch (error: any) {
        console.error("Error in debug component:", error)
        setError(error.message || "Failed to load debug data")
      } finally {
        setLoading(false)
      }
    }

    if (playerId) {
      fetchData()
    }
  }, [supabase, playerId])

  if (loading) {
    return <div>Loading debug data...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Player Awards Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Raw Player Awards Data</h3>
              <p className="text-sm text-muted-foreground mb-2">
                This shows the raw data from the player_awards table for this player.
              </p>
              <div className="bg-muted rounded-md p-4 overflow-auto max-h-96">
                <Code>
                  <pre>{JSON.stringify(playerAwards, null, 2)}</pre>
                </Code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Awards Page Query Data</h3>
              <p className="text-sm text-muted-foreground mb-2">
                This shows the data as it would be fetched on the awards page.
              </p>
              <div className="bg-muted rounded-md p-4 overflow-auto max-h-96">
                <Code>
                  <pre>{JSON.stringify(awardsPageData, null, 2)}</pre>
                </Code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Column Comparison</h3>
              <p className="text-sm text-muted-foreground mb-2">
                This shows the available columns and their values for the first award.
              </p>
              {playerAwards.length > 0 ? (
                <div className="bg-muted rounded-md p-4 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2">Column</th>
                        <th className="text-left p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(playerAwards[0]).map(([key, value]) => (
                        <tr key={key} className="border-t border-muted-foreground/20">
                          <td className="p-2 font-mono">{key}</td>
                          <td className="p-2 font-mono">
                            {typeof value === "object" ? JSON.stringify(value) : String(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No awards data available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
