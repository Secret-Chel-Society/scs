"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, User, Users, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Waiver {
  id: string
  player_id: string
  waiving_team_id: string
  waived_at: string
  claim_deadline: string
  status: "active" | "claimed" | "expired" | "cancelled"
  winning_team_id?: string
  players: {
    id: string
    salary: number
    users: {
      id: string
      gamer_tag_id: string
      primary_position: string
      secondary_position?: string
      console: string
      avatar_url?: string
    }
  }
  waiving_team: {
    id: string
    name: string
    logo_url?: string
  }
  winning_team?: {
    id: string
    name: string
    logo_url?: string
  }
  waiver_claims?: Array<{
    id: string
    claiming_team_id: string
    priority_at_claim: number
    status: string
    teams: {
      name: string
      logo_url?: string
    }
  }>
}

export function WaiverHistory() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [waivers, setWaivers] = useState<Waiver[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active")

  useEffect(() => {
    fetchWaivers()
    // Refresh every 30 seconds to update time remaining
    const interval = setInterval(fetchWaivers, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchWaivers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("waivers")
        .select(`
          *,
          players:player_id (
            id,
            salary,
            users:user_id (
              id,
              gamer_tag_id,
              primary_position,
              secondary_position,
              console,
              avatar_url
            )
          ),
          waiving_team:waiving_team_id (
            id,
            name,
            logo_url
          ),
          winning_team:winning_team_id (
            id,
            name,
            logo_url
          ),
          waiver_claims (
            id,
            claiming_team_id,
            priority_at_claim,
            status,
            teams:claiming_team_id (
              name,
              logo_url
            )
          )
        `)
        .order("waived_at", { ascending: false })

      if (error) {
        console.error("Error fetching waivers:", error)
        toast({
          title: "Error",
          description: "Failed to load waiver history",
          variant: "destructive",
        })
        return
      }

      setWaivers(data || [])
    } catch (error) {
      console.error("Error fetching waivers:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeRemaining = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    }
    return `${minutes}m remaining`
  }

  const getStatusBadge = (status: string, deadline: string) => {
    const timeRemaining = getTimeRemaining(deadline)
    
    switch (status) {
      case "active":
        if (timeRemaining === "Expired") {
          return <Badge variant="destructive">Expired</Badge>
        }
        return <Badge variant="default" className="bg-green-600">Active</Badge>
      case "claimed":
        return <Badge variant="default" className="bg-blue-600">Claimed</Badge>
      case "expired":
        return <Badge variant="secondary">Expired</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />
      case "claimed":
        return <CheckCircle className="h-4 w-4" />
      case "expired":
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const filterWaivers = (status: string) => {
    if (status === "active") {
      return waivers.filter(w => w.status === "active" && getTimeRemaining(w.claim_deadline) !== "Expired")
    }
    return waivers.filter(w => w.status === status || (status === "expired" && w.status === "active" && getTimeRemaining(w.claim_deadline) === "Expired"))
  }

  const WaiverCard = ({ waiver }: { waiver: Waiver }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(waiver.status)}
              {getStatusBadge(waiver.status, waiver.claim_deadline)}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(waiver.waived_at).toLocaleDateString()} at {new Date(waiver.waived_at).toLocaleTimeString()}
            </div>
          </div>
          {waiver.status === "active" && getTimeRemaining(waiver.claim_deadline) !== "Expired" && (
            <div className="text-sm font-medium text-orange-600">
              {getTimeRemaining(waiver.claim_deadline)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Player Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">{waiver.players?.users?.gamer_tag_id}</div>
                <div className="text-sm text-muted-foreground">
                  {waiver.players?.users?.primary_position} • ${waiver.players?.salary?.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Waived by</div>
              <div className="text-sm text-muted-foreground">{waiver.waiving_team?.name}</div>
            </div>
          </div>

          {/* Claims Info */}
          {waiver.waiver_claims && waiver.waiver_claims.length > 0 && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Claims ({waiver.waiver_claims.length})</span>
              </div>
              <div className="space-y-1">
                {waiver.waiver_claims.map((claim, index) => (
                  <div key={claim.id} className="flex items-center justify-between text-sm">
                    <span>{claim.teams?.name}</span>
                    <span className="text-muted-foreground">Priority: {claim.priority_at_claim}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Winner Info */}
          {waiver.status === "claimed" && waiver.winning_team && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Claimed by:</span>
                <span className="text-sm font-medium text-green-600">{waiver.winning_team.name}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const activeWaivers = filterWaivers("active")
  const claimedWaivers = filterWaivers("claimed")
  const expiredWaivers = filterWaivers("expired")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Waiver History</h2>
        <p className="text-muted-foreground">
          Track all player waivers, claims, and their current status
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active ({activeWaivers.length})
          </TabsTrigger>
          <TabsTrigger value="claimed">
            Claimed ({claimedWaivers.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({expiredWaivers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeWaivers.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No active waivers</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            activeWaivers.map((waiver) => <WaiverCard key={waiver.id} waiver={waiver} />)
          )}
        </TabsContent>

        <TabsContent value="claimed" className="space-y-4">
          {claimedWaivers.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No claimed waivers</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            claimedWaivers.map((waiver) => <WaiverCard key={waiver.id} waiver={waiver} />)
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {expiredWaivers.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <XCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No expired waivers</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            expiredWaivers.map((waiver) => <WaiverCard key={waiver.id} waiver={waiver} />)
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={fetchWaivers} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
    </div>
  )
}
