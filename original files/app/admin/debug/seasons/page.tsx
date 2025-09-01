"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

export default function SeasonsDebugPage() {
  const { supabase } = useSupabase()
  const [seasons, setSeasons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM seasons ORDER BY name")
  const [queryResult, setQueryResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSeasons()
  }, [supabase])

  async function fetchSeasons() {
    setLoading(true)
    try {
      // Fetch seasons
      const { data, error } = await supabase.from("seasons").select("*").order("name")

      if (error) throw error
      setSeasons(data || [])

      // Process seasons to extract numbers from names
      const processedSeasons = data.map((season) => {
        const nameMatch = season.name.match(/Season\s+(\d+)/i)
        const seasonNumber = nameMatch ? Number.parseInt(nameMatch[1], 10) : null

        return {
          ...season,
          extracted_number: seasonNumber,
        }
      })

      console.log("Processed seasons:", processedSeasons)
    } catch (error: any) {
      console.error("Error fetching seasons:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function runQuery() {
    try {
      setError(null)
      const { data, error } = await supabase.rpc("run_sql", { query: sqlQuery })

      if (error) throw error
      setQueryResult(data)
    } catch (error: any) {
      console.error("Error running query:", error)
      setError(error.message)
      setQueryResult(null)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Seasons Debug</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Seasons Table</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading seasons...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Number (if exists)</TableHead>
                    <TableHead>Extracted Number</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasons.map((season) => {
                    // Extract number from season name
                    const nameMatch = season.name.match(/Season\s+(\d+)/i)
                    const extractedNumber = nameMatch ? Number.parseInt(nameMatch[1], 10) : null

                    return (
                      <TableRow key={season.id}>
                        <TableCell className="font-mono text-xs">{season.id}</TableCell>
                        <TableCell>{season.name}</TableCell>
                        <TableCell>{season.number !== undefined ? season.number : "N/A"}</TableCell>
                        <TableCell>{extractedNumber !== null ? extractedNumber : "N/A"}</TableCell>
                        <TableCell>{new Date(season.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run SQL Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)} rows={5} className="font-mono" />
              <Button onClick={runQuery}>Run Query</Button>

              {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded-md">
                  <p className="font-bold">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              {queryResult && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Query Result:</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                    {JSON.stringify(queryResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Awards Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={async () => {
                  setSqlQuery("SELECT * FROM player_awards ORDER BY season_number, created_at DESC")
                  await runQuery()
                }}
              >
                View Player Awards
              </Button>
              <Button
                onClick={async () => {
                  setSqlQuery("SELECT * FROM team_awards ORDER BY season_number, created_at DESC")
                  await runQuery()
                }}
              >
                View Team Awards
              </Button>
              <Button
                onClick={async () => {
                  setSqlQuery(`
                    SELECT 
                      pa.id, 
                      pa.award_type, 
                      pa.season_number,
                      s.name as season_name,
                      pa.year
                    FROM 
                      player_awards pa
                    LEFT JOIN 
                      seasons s ON s.number = pa.season_number
                    ORDER BY 
                      pa.season_number, pa.created_at DESC
                  `)
                  await runQuery()
                }}
              >
                Join Player Awards with Seasons
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
