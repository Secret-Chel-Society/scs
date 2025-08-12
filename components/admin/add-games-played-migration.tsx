"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"

export function AddGamesPlayedMigration() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/admin/run-migration/add-games-played", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setSuccess(true)
      toast({
        title: "Migration successful",
        description: "Added games_played column to ea_player_stats table.",
      })
    } catch (err: any) {
      setError(err.message || "An error occurred while running the migration")
      toast({
        title: "Migration failed",
        description: err.message || "An error occurred while running the migration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Games Played Column to EA Player Stats</CardTitle>
        <CardDescription>
          This migration adds a games_played column to the ea_player_stats table to track how many games a player has
          participated in, especially important for combined match statistics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="prose max-w-none dark:prose-invert">
            <p>
              When combining multiple matches, it's important to track how many games each player has participated in.
              This helps with accurate stat averaging and display.
            </p>
            <p>
              This migration adds the <code>games_played</code> column to the <code>ea_player_stats</code> table with a
              default value of 1.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={runMigration} disabled={loading || success}>
              {loading ? "Running Migration..." : success ? "Migration Completed" : "Run Migration"}
            </Button>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Migration completed successfully!</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
