"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSupabase } from "@/lib/supabase/client"
import { Code } from "@/components/ui/code"

export default function AwardsSqlDebugPage() {
  const { supabase } = useSupabase()
  const [sql, setSql] = useState(`SELECT * FROM player_awards LIMIT 10;`)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function runQuery() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.rpc("run_sql", { sql_query: sql })

      if (error) throw error

      setResults(data)
    } catch (err: any) {
      console.error("SQL error:", err)
      setError(err.message || "An error occurred running the SQL query")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Awards SQL Debug</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>SQL Query</CardTitle>
          <CardDescription>Run SQL queries to debug the awards tables</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={sql} onChange={(e) => setSql(e.target.value)} className="font-mono mb-4 h-40" />
          <Button onClick={runQuery} disabled={loading}>
            {loading ? "Running..." : "Run Query"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-8 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-md p-4 overflow-auto max-h-[500px]">
              <Code>
                <pre>{JSON.stringify(results, null, 2)}</pre>
              </Code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
