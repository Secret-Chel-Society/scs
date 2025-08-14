"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeftRight, AlertCircle, DollarSign } from "lucide-react"
import { TeamLogo } from "@/components/team-logo"
import Link from "next/link"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function TradesNewsPage() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Record<string, any>>({})
  const [players, setPlayers] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [runningMigration, setRunningMigration] = useState(false)

  useEffect(() => {
    let mounted = true

    // Check if trades table exists
    const checkTableExists = async () => {
      try {
        const { error } = await supabase.from("trades").select("id").limit(1)

        if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
          if (mounted) {
            setTableExists(false)
            setError("The trades table does not exist yet. Please run the migration first.")
            setLoading(false)
          }
          return false
        }

        return true
      } catch (error) {
        console.error("Error checking if table exists:", error)
        return false
      }
    }

    // Fetch all teams first to have team data available
    const fetchTeams = async () => {
      try {
        const { data, error } = await supabase.from("teams").select("*")

        if (error) {
          throw error
        }

        if (mounted) {
          const teamMap: Record<string, any> = {}
          data?.forEach((team) => {
            teamMap[team.id] = team
          })
          setTeams(teamMap)
        }
        return true
      } catch (error: any) {
        console.error("Error fetching teams:", error)
        if (mounted) {
          setError(`Failed to load teams: ${error.message || "Unknown error"}`)
        }
        return false
      }
    }

    // Fetch all players with user data to have complete player information available
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase.from("players").select(`
          id,
          user_id,
          team_id,
          salary,
          role,
          users (
            id,
            gamer_tag_id,
            email,
            primary_position,
            secondary_position
          )
        `)

        if (error) {
          console.error("Error fetching players:", error)
          if (mounted) {
            setError(`Failed to load players: ${error.message}`)
            setLoading(false)
          }
          return false
        }

        if (mounted) {
          const playerMap: Record<string, any> = {}
          data?.forEach((player) => {
            playerMap[player.id] = player
          })
          setPlayers(playerMap)
        }
        return true
      } catch (error: any) {
        console.error("Error fetching players:", error)
        if (mounted) {
          setError(`Failed to load players: ${error.message || "Unknown error"}`)
          setLoading(false)
        }
        return false
      }
    }

    // Fetch trades - only show accepted and completed trades
    const fetchTrades = async () => {
      try {
        if (mounted) {
          setLoading(true)
        }

        // First check if the table exists
        const exists = await checkTableExists()
        if (!exists) return

        // Check if status column exists by trying to select it
        let hasStatusColumn = false
        try {
          const { error: statusCheckError } = await supabase.from("trades").select("status").limit(1)

          hasStatusColumn = !statusCheckError
        } catch (e) {
          hasStatusColumn = false
        }

        let query = supabase.from("trades").select("*")

        // Only apply status filter if the column exists
        if (hasStatusColumn) {
          query = query.in("status", ["accepted", "completed"])
        }

        const { data, error } = await query.order("created_at", { ascending: false })

        if (error) throw error

        if (mounted) {
          setTrades(data || [])
        }
      } catch (error: any) {
        console.error("Error loading trades:", error)
        if (mounted) {
          setError(error.message || "Failed to load trade history.")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Load initial data
    const loadData = async () => {
      const teamsLoaded = await fetchTeams()
      const playersLoaded = await fetchPlayers()
      if (teamsLoaded && playersLoaded) {
        await fetchTrades()
      }
    }

    loadData()

    // Set up real-time subscription for trades only if table exists
    let tradesSubscription: any = null

    if (tableExists) {
      tradesSubscription = supabase
        .channel("trades-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "trades",
          },
          (payload) => {
            if (!mounted) return

            // Only add trades that are accepted or completed (or if no status column)
            if (!payload.new.status || payload.new.status === "accepted" || payload.new.status === "completed") {
              setTrades((currentTrades) => [payload.new, ...currentTrades])

              // Show a toast notification for the new trade
              setTeams((currentTeams) => {
                const team1 = currentTeams[payload.new.team1_id]?.name || "Unknown Team"
                const team2 = currentTeams[payload.new.team2_id]?.name || "Unknown Team"

                toast({
                  title: "New Trade Alert!",
                  description: `${team1} and ${team2} have completed a trade.`,
                })

                return currentTeams
              })
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "trades",
          },
          (payload) => {
            if (!mounted) return

            // Handle status updates - add if now accepted/completed, remove if rejected
            if (!payload.new.status || payload.new.status === "accepted" || payload.new.status === "completed") {
              setTrades((currentTrades) => {
                const existingIndex = currentTrades.findIndex((t) => t.id === payload.new.id)
                if (existingIndex >= 0) {
                  // Update existing trade
                  const updated = [...currentTrades]
                  updated[existingIndex] = payload.new
                  return updated
                } else {
                  // Add new trade
                  return [payload.new, ...currentTrades]
                }
              })
            } else {
              // Remove trade if status changed to rejected or other
              setTrades((currentTrades) => currentTrades.filter((t) => t.id !== payload.new.id))
            }
          },
        )
        .subscribe()
    }

    // Clean up subscription on unmount
    return () => {
      mounted = false
      if (tradesSubscription) {
        supabase.removeChannel(tradesSubscription)
      }
    }
  }, [supabase, toast, tableExists])

  // Enhanced renderPlayer function with gamertag, positions, and salary
  const renderPlayer = (player: any) => {
    if (!player) return null

    // Handle string player IDs (legacy format)
    if (typeof player === "string") {
      const playerData = players[player]
      if (playerData) {
        // If we found the player data, render it properly
        const gamerTag = playerData.users?.gamer_tag_id || "Unknown Player"
        const primaryPos = playerData.users?.primary_position || ""
        const secondaryPos = playerData.users?.secondary_position || ""
        const positions = [primaryPos, secondaryPos].filter(Boolean).join("/")
        const salary = playerData.salary || 0

        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{gamerTag}</span>
              {positions && (
                <Badge variant="outline" className="ml-1">
                  {positions}
                </Badge>
              )}
            </div>
            {salary > 0 && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <DollarSign className="h-3 w-3 mr-1" />
                <span>${(salary / 1000000).toFixed(2)}M</span>
              </div>
            )}
          </div>
        )
      }
      // If we couldn't find the player data, just return the ID
      return (
        <div className="flex flex-col">
          <span className="font-medium">Player ID: {player}</span>
        </div>
      )
    }

    // Handle player objects
    // Get the player's ID
    const playerId = player.id || player.player_id

    // Look up the complete player data from our players state
    const playerData = playerId ? players[playerId] : null

    // Extract player information with fallbacks
    let gamerTag, primaryPos, secondaryPos, salary

    if (playerData) {
      // Use data from our players state if available
      gamerTag = playerData.users?.gamer_tag_id || "Unknown Player"
      primaryPos = playerData.users?.primary_position || ""
      secondaryPos = playerData.users?.secondary_position || ""
      salary = playerData.salary || 0
    } else {
      // Fallback to data in the trade record
      gamerTag = player.name || player.player_name || player.gamer_tag_id || "Unknown Player"
      primaryPos = player.primary_position || player.position || player.pos || ""
      secondaryPos = player.secondary_position || ""
      salary = player.salary || player.player_salary || 0
    }

    const positions = [primaryPos, secondaryPos].filter(Boolean).join("/")

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium">{gamerTag}</span>
          {positions && (
            <Badge variant="outline" className="ml-1">
              {positions}
            </Badge>
          )}
        </div>
        {salary > 0 && (
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <DollarSign className="h-3 w-3 mr-1" />
            <span>${(salary / 1000000).toFixed(2)}M</span>
          </div>
        )}
      </div>
    )
  }

  // Update the formatTrade function to better handle player data
  const formatTrade = (trade: any) => {
    const team1 = teams[trade.team1_id]
    const team2 = teams[trade.team2_id]

    if (!team1 || !team2) return null

    // Parse player arrays if they're stored as strings
    let team1Players = []
    let team2Players = []

    try {
      // Handle different data formats
      if (typeof trade.team1_players === "string") {
        team1Players = JSON.parse(trade.team1_players)
      } else if (Array.isArray(trade.team1_players)) {
        team1Players = trade.team1_players
      } else if (trade.team1_players) {
        team1Players = [trade.team1_players]
      }

      if (typeof trade.team2_players === "string") {
        team2Players = JSON.parse(trade.team2_players)
      } else if (Array.isArray(trade.team2_players)) {
        team2Players = trade.team2_players
      } else if (trade.team2_players) {
        team2Players = [trade.team2_players]
      }
    } catch (error) {
      console.error("Error parsing player data:", error)
      team1Players = Array.isArray(trade.team1_players) ? trade.team1_players : []
      team2Players = Array.isArray(trade.team2_players) ? trade.team2_players : []
    }

    return {
      id: trade.id,
      team1: {
        id: team1.id,
        name: team1.name,
        logo_url: team1.logo_url,
        players: team1Players || [],
      },
      team2: {
        id: team2.id,
        name: team2.name,
        logo_url: team2.logo_url,
        players: team2Players || [],
      },
      message: trade.trade_message,
      status: trade.status,
      created_at: trade.created_at,
    }
  }

  // Run the migration to create the trades table
  const runMigration = async () => {
    try {
      setRunningMigration(true)

      // Execute the SQL to create the trades table with status column
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.trades (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            team1_id UUID NOT NULL REFERENCES public.teams(id),
            team2_id UUID NOT NULL REFERENCES public.teams(id),
            team1_players JSONB NOT NULL DEFAULT '[]'::jsonb,
            team2_players JSONB NOT NULL DEFAULT '[]'::jsonb,
            trade_message TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
          );
          
          -- Add status column if it doesn't exist
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'status') THEN
              ALTER TABLE public.trades ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));
            END IF;
          END $$;
          
          -- Add RLS policies
          ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
          
          -- Allow anyone to read trades
          CREATE POLICY IF NOT EXISTS "Trades are viewable by everyone" 
          ON public.trades FOR SELECT 
          USING (true);
          
          -- Only authenticated users can insert trades
          CREATE POLICY IF NOT EXISTS "Authenticated users can insert trades" 
          ON public.trades FOR INSERT 
          TO authenticated 
          WITH CHECK (true);
          
          -- Only admins can update or delete trades
          CREATE POLICY IF NOT EXISTS "Only admins can update trades" 
          ON public.trades FOR UPDATE 
          TO authenticated 
          USING (
            auth.uid() IN (
              SELECT auth.uid() 
              FROM public.players 
              WHERE role = 'Admin'
            )
          );
          
          CREATE POLICY IF NOT EXISTS "Only admins can delete trades" 
          ON public.trades FOR DELETE 
          TO authenticated 
          USING (
            auth.uid() IN (
              SELECT auth.uid() 
              FROM public.players 
              WHERE role = 'Admin'
            )
          );
        `,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Migration Successful",
        description: "The trades table has been created successfully with status column.",
      })

      // Refresh the page to show the trades
      setTableExists(true)
      setError(null)
      window.location.reload()
    } catch (error: any) {
      console.error("Error running migration:", error)
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to create trades table.",
        variant: "destructive",
      })
    } finally {
      setRunningMigration(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trade History</h1>
            <p className="text-muted-foreground">Recent completed trades between MGHL teams</p>
          </div>
          <Link href="/news" className="text-primary hover:underline flex items-center gap-1">
            ← Back to News
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {!tableExists && (
                <div className="mt-4">
                  <p className="mb-2">
                    To create the trades table with status filtering, you need to run the migration:
                  </p>
                  <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                    {`-- Run this SQL in your database
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team1_id UUID NOT NULL REFERENCES teams(id),
  team2_id UUID NOT NULL REFERENCES teams(id),
  team1_players JSONB,
  team2_players JSONB,
  trade_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add status column if it doesn't exist
ALTER TABLE trades ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS trades_created_at_idx ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS trades_status_idx ON trades(status);`}
                  </pre>
                  <div className="flex gap-4 mt-4">
                    <Button variant="default" onClick={runMigration} disabled={runningMigration}>
                      {runningMigration ? "Running Migration..." : "Run Migration Now"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team1_id UUID NOT NULL REFERENCES teams(id),
  team2_id UUID NOT NULL REFERENCES teams(id),
  team1_players JSONB,
  team2_players JSONB,
  trade_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add status column if it doesn't exist
ALTER TABLE trades ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS trades_created_at_idx ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS trades_status_idx ON trades(status);`)
                        toast({
                          title: "SQL Copied",
                          description: "The SQL migration has been copied to your clipboard.",
                        })
                      }}
                    >
                      Copy SQL to Clipboard
                    </Button>
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : trades.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {trades.map((trade) => {
              const formattedTrade = formatTrade(trade)
              if (!formattedTrade) return null

              return (
                <Card key={trade.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">Trade Completed</CardTitle>
                        {formattedTrade.status && (
                          <Badge variant={formattedTrade.status === "completed" ? "default" : "secondary"}>
                            {formattedTrade.status}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {formatDistanceToNow(new Date(trade.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                      {/* Team 1 */}
                      <div className="md:col-span-3">
                        <div className="flex items-center gap-3 mb-4">
                          {formattedTrade.team1.logo_url ? (
                            <Image
                              src={formattedTrade.team1.logo_url || "/placeholder.svg"}
                              alt={formattedTrade.team1.name}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <TeamLogo teamName={formattedTrade.team1.name} size="md" />
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{formattedTrade.team1.name}</h3>
                            <Link
                              href={`/teams/${formattedTrade.team1.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              View Team
                            </Link>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Traded Away:</h4>
                          {formattedTrade.team1.players.length > 0 ? (
                            <ul className="space-y-3">
                              {formattedTrade.team1.players.map((player: any, index: number) => (
                                <li key={index} className="flex flex-col">
                                  {renderPlayer(player)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No players traded</p>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center items-center md:col-span-1">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <ArrowLeftRight className="h-6 w-6 text-primary" />
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="md:col-span-3">
                        <div className="flex items-center gap-3 mb-4">
                          {formattedTrade.team2.logo_url ? (
                            <Image
                              src={formattedTrade.team2.logo_url || "/placeholder.svg"}
                              alt={formattedTrade.team2.name}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <TeamLogo teamName={formattedTrade.team2.name} size="md" />
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{formattedTrade.team2.name}</h3>
                            <Link
                              href={`/teams/${formattedTrade.team2.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              View Team
                            </Link>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Traded Away:</h4>
                          {formattedTrade.team2.players.length > 0 ? (
                            <ul className="space-y-3">
                              {formattedTrade.team2.players.map((player: any, index: number) => (
                                <li key={index} className="flex flex-col">
                                  {renderPlayer(player)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No players traded</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Trade Message */}
                    {formattedTrade.message && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="font-medium mb-2">Trade Notes:</h4>
                        <p className="text-muted-foreground">{formattedTrade.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-xl font-semibold mb-2">No Completed Trades Found</h2>
              <p className="text-muted-foreground">
                There are no accepted or completed trades recorded in the league history yet.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
