"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, UserCircle } from "lucide-react"
import Link from "next/link"

interface PlayerSignup {
  id: string
  user_id: string
  gamer_tag: string
  primary_position: string
  secondary_position: string | null
  console: string
  status: string
}

export function PlayerSignupsList() {
  const [players, setPlayers] = useState<PlayerSignup[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerSignup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPlayers() {
      try {
        console.log("Fetching players from API...")

        const response = await fetch("/api/player-signups")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch players")
        }

        console.log("API response:", data)

        if (data.players) {
          setPlayers(data.players)
          setFilteredPlayers(data.players)
          console.log(`Loaded ${data.players.length} players`)
        } else {
          console.log("No players in response")
          setPlayers([])
          setFilteredPlayers([])
        }
      } catch (error: any) {
        console.error("Error loading players:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadPlayers()
  }, [])

  // Filter players
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPlayers(players)
      return
    }

    const filtered = players.filter((player) => player.gamer_tag.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredPlayers(filtered)
  }, [searchTerm, players])

  if (loading) {
    return <div className="text-center py-8">Loading player signups...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading players: {error}</p>
        {process.env.NODE_ENV === "development" && <p className="text-xs mt-2">Check console for details</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Found {filteredPlayers.length} players
        {process.env.NODE_ENV === "development" && (
          <span className="ml-2 text-xs">({players.length} total loaded)</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map((player) => (
          <Card key={player.id}>
            <CardContent className="p-4">
              <Link href={`/players/${player.user_id}`} className="block hover:opacity-80">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">{player.gamer_tag}</h3>
                    <div className="text-sm text-muted-foreground">
                      {player.primary_position}
                      {player.secondary_position && ` / ${player.secondary_position}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {player.console}
                      {process.env.NODE_ENV === "development" && <span className="ml-1">• {player.status}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlayers.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          {players.length === 0 ? (
            <div>
              <p>No player signups found</p>
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs mt-2">
                  This could mean:
                  <br />• No approved registrations yet
                  <br />• All registrations are still pending
                  <br />• Check server console for details
                </p>
              )}
            </div>
          ) : (
            "No players match your search"
          )}
        </div>
      )}
    </div>
  )
}
