// Midnight Studios INTl - All rights reserved
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Trophy, 
  RefreshCw, 
  RotateCcw, 
  AlertTriangle,
  Crown,
  Award,
  Clock
} from "lucide-react"
import Image from "next/image"

interface Team {
  id: string
  name: string
  logo_url?: string
}

interface WaiverPriority {
  id: string
  team_id: string
  priority: number
  last_used?: string
  teams: Team
}

const WaiverPriorityPage = () => {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  
  // State
  const [waiverPriority, setWaiverPriority] = useState<WaiverPriority[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  // Load waiver priority
  useEffect(() => {
    loadWaiverPriority()
  }, [])

  const loadWaiverPriority = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: priority, error } = await supabase
        .from('waiver_priority')
        .select(`
          id,
          team_id,
          priority,
          last_used,
          teams (
            id,
            name,
            logo_url
          )
        `)
        .order('priority', { ascending: true })

      if (error) throw error
      setWaiverPriority(priority || [])
    } catch (error) {
      console.error('Error loading waiver priority:', error)
      setError(error instanceof Error ? error.message : 'Failed to load waiver priority')
      toast({
        title: "Error",
        description: "Failed to load waiver priority",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetWaiverPriority = async () => {
    try {
      setResetting(true)

      const response = await fetch('/api/waivers/v3/reset-priority', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset waiver priority')
      }

      toast({
        title: "Success",
        description: "Waiver priority reset successfully",
      })

      await loadWaiverPriority()
    } catch (error) {
      console.error('Error resetting waiver priority:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to reset waiver priority',
        variant: "destructive"
      })
    } finally {
      setResetting(false)
    }
  }

  const formatLastUsed = (lastUsed?: string) => {
    if (!lastUsed) return 'Never'
    
    const date = new Date(lastUsed)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'bg-yellow-100 text-yellow-800'
    if (priority <= 3) return 'bg-orange-100 text-orange-800'
    if (priority <= 6) return 'bg-blue-100 text-blue-800'
    if (priority <= 10) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getPriorityIcon = (priority: number) => {
    if (priority === 1) return <Crown className="h-4 w-4" />
    if (priority <= 3) return <Trophy className="h-4 w-4" />
    if (priority <= 6) return <Award className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Waiver Priority</h1>
            <p className="text-muted-foreground">Manage team waiver priority order</p>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadWaiverPriority}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waiver Priority</h1>
          <p className="text-muted-foreground">Manage team waiver priority order</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadWaiverPriority} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={resetting}>
                <RotateCcw className={`h-4 w-4 mr-2 ${resetting ? 'animate-spin' : ''}`} />
                Reset Priority
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Waiver Priority</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all team waiver priorities to their default order. 
                  This action cannot be undone. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetWaiverPriority} disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Reset Priority'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Priority Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Priority System
          </CardTitle>
          <CardDescription>
            Teams are ordered by waiver priority. Lower numbers have higher priority.
            When a player is claimed, the claiming team moves to the bottom of the priority list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <div className="text-sm text-muted-foreground">Highest Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {waiverPriority.filter(p => p.priority <= 3).length}
              </div>
              <div className="text-sm text-muted-foreground">Top 3 Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {waiverPriority.filter(p => p.priority <= 6).length}
              </div>
              <div className="text-sm text-muted-foreground">Top 6 Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {waiverPriority.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Teams</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Priority Order</CardTitle>
          <CardDescription>
            Current waiver priority order for all teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {waiverPriority.map((priority, index) => (
              <motion.div
                key={priority.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                      <span className="text-sm font-semibold">{priority.priority}</span>
                    </div>
                    <div className="relative">
                      {priority.teams.logo_url ? (
                        <Image
                          src={priority.teams.logo_url}
                          alt={priority.teams.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-600">
                            {priority.teams.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{priority.teams.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last used: {formatLastUsed(priority.last_used)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(priority.priority)}>
                      {getPriorityIcon(priority.priority)}
                      <span className="ml-1">
                        {priority.priority === 1 ? 'First' : 
                         priority.priority === 2 ? 'Second' : 
                         priority.priority === 3 ? 'Third' : 
                         `#${priority.priority}`}
                      </span>
                    </Badge>
                    {priority.priority === 1 && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Crown className="h-3 w-3 mr-1" />
                        Next to Claim
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">How Priority Works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Teams are ordered by priority number (1 = highest)</li>
                <li>• When a team claims a player, they move to the bottom</li>
                <li>• All other teams move up one position</li>
                <li>• Priority resets at the start of each season</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Claiming Process</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multiple teams can claim the same player</li>
                <li>• Highest priority team wins the claim</li>
                <li>• Claims are processed when waivers expire</li>
                <li>• Ties are broken by earliest claim time</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WaiverPriorityPage
