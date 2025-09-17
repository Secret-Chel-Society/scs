// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  Gavel, 
  Trophy, 
  DollarSign,
  Calendar,
  Settings,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ManagementNav } from "@/components/management/management-nav"

interface Team {
  id: string
  name: string
  logo_url?: string
  wins: number
  losses: number
  points: number
  games_played: number
}

const ManagementPage = () => {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  
  // State
  const [teamData, setTeamData] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user's team
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      const { data: player } = await supabase
        .from('players')
        .select(`
          team_id,
          teams (
            id,
            name,
            logo_url,
            wins,
            losses,
            points,
            games_played
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (player?.team_id) {
        setTeamData(player.teams)
      } else {
        setError('You are not on a team')
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/20">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-12 w-12 animate-spin" />
              <p>Loading team management...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/20">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadInitialData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/20">
      <div className="container mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Navigation */}
          <div className="mb-8">
            <ManagementNav />
          </div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Team Management</h1>
            <p className="text-xl text-muted-foreground">
              Complete control over your team's operations
            </p>
          </div>

          {/* Team Info */}
          {teamData && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {teamData.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  {teamData.logo_url && (
                    <Image
                      src={teamData.logo_url}
                      alt={teamData.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{teamData.name}</h3>
                    <p className="text-muted-foreground">Team Management Dashboard</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{teamData.wins}</div>
                    <div className="text-sm text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{teamData.losses}</div>
                    <div className="text-sm text-muted-foreground">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{teamData.points}</div>
                    <div className="text-sm text-muted-foreground">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{teamData.games_played}</div>
                    <div className="text-sm text-muted-foreground">Games Played</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/management/waivers" className="group">
              <Card className="hockey-card hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Gavel className="h-8 w-8 text-blue-500 mx-auto mb-2 group-hover:text-blue-400 transition-colors" />
                  <h3 className="font-semibold text-lg mb-1">Waiver System</h3>
                  <p className="text-sm text-muted-foreground">Manage player waivers and claims</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/management/lineups" className="group">
              <Card className="hockey-card hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-green-500 mx-auto mb-2 group-hover:text-green-400 transition-colors" />
                  <h3 className="font-semibold text-lg mb-1">Lineups</h3>
                  <p className="text-sm text-muted-foreground">Set your team lineups</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/management/bids" className="group">
              <Card className="hockey-card hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 text-yellow-500 mx-auto mb-2 group-hover:text-yellow-400 transition-colors" />
                  <h3 className="font-semibold text-lg mb-1">Bidding</h3>
                  <p className="text-sm text-muted-foreground">Manage player bids</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current status of all management systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Waiver System V3 - Operational</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Priority Management - Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Team Management - Online</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Database Connection - Stable</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default ManagementPage


