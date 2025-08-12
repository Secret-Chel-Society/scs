"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function FixTieGames() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFixTieGames = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/fix-tie-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix tie games")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Tie Games in Standings</CardTitle>
        <CardDescription>
          Recalculate standings to properly count tie games (1-1, 2-2, etc.) as losses for both teams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleFixTieGames} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing Tie Games...
            </>
          ) : (
            "Fix Tie Games & Recalculate Standings"
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>{result.message}</p>
                {result.tieGames && result.tieGames.length > 0 && (
                  <div>
                    <p className="font-semibold">Tie games found:</p>
                    <ul className="list-disc list-inside text-sm">
                      {result.tieGames.map((game: any, index: number) => (
                        <li key={index}>
                          {game.teams} - Score: {game.score}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p>Updated {result.updatedTeams} teams in standings</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
