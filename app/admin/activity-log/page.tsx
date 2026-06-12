"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Activity,
  User,
  Users,
  FileCheck,
  Repeat,
  DollarSign,
  Shield,
  ChevronLeft,
  ChevronRight,
  Calendar
} from "lucide-react"

interface ActivityLog {
  id: string
  actor_id: string
  actor_name: string | null
  actor_type: string | null
  action_type: string
  action_description: string | null
  target_id: string | null
  target_name: string | null
  category: string | null
  league: string | null
  metadata: any
  created_at: string
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "Registration", label: "Registration" },
  { value: "Trade", label: "Trade" },
  { value: "Release", label: "Release" },
  { value: "Role", label: "Role" },
  { value: "Bidding", label: "Bidding" },
  { value: "Account", label: "Account" },
  { value: "Waiver", label: "Waiver" },
  { value: "Match", label: "Match" },
]

const ACTOR_TYPES = [
  { value: "all", label: "All Actor Types" },
  { value: "Site Owner", label: "Site Owner" },
  { value: "Admin", label: "Admin" },
  { value: "UPHL Admin", label: "UPHL Admin" },
  { value: "Owner", label: "Owner" },
  { value: "GM", label: "GM" },
  { value: "AGM", label: "AGM" },
  { value: "Manager", label: "Manager" },
  { value: "Player", label: "Player" },
]

const LEAGUES = [
  { value: "all", label: "All Leagues" },
  { value: "NHL", label: "NHL" },
  { value: "AHL", label: "AHL" },
]

function getCategoryBadge(category: string | null) {
  const categoryColors: Record<string, string> = {
    Registration: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Trade: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Release: "bg-red-500/20 text-red-400 border-red-500/30",
    Role: "bg-green-500/20 text-green-400 border-green-500/30",
    Bidding: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Account: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    Waiver: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Match: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  }
  
  return (
    <Badge 
      variant="outline" 
      className={categoryColors[category || ""] || "bg-muted text-muted-foreground"}
    >
      {category || "Unknown"}
    </Badge>
  )
}

function getCategoryIcon(category: string | null) {
  switch (category) {
    case "Registration":
      return <FileCheck className="h-4 w-4 text-blue-400" />
    case "Trade":
      return <Repeat className="h-4 w-4 text-purple-400" />
    case "Release":
      return <User className="h-4 w-4 text-red-400" />
    case "Role":
      return <Shield className="h-4 w-4 text-green-400" />
    case "Bidding":
      return <DollarSign className="h-4 w-4 text-yellow-400" />
    case "Account":
      return <Users className="h-4 w-4 text-cyan-400" />
    case "Waiver":
      return <User className="h-4 w-4 text-orange-400" />
    case "Match":
      return <Activity className="h-4 w-4 text-pink-400" />
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />
  }
}

export default function ActivityLogPage() {
  const router = useRouter()
  const { supabase, session, loading: authLoading } = useSupabase()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [actorTypeFilter, setActorTypeFilter] = useState("all")
  const [leagueFilter, setLeagueFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 100

  // Check admin access
  useEffect(() => {
    async function checkAdmin() {
      if (!session?.user?.id) return
      
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .in("role", ["Admin", "Site Owner"])
      
      if (roles && roles.length > 0) {
        setIsAdmin(true)
      } else {
        router.push("/")
      }
    }
    
    if (!authLoading) {
      checkAdmin()
    }
  }, [session?.user?.id, authLoading, supabase, router])

  const fetchActivities = useCallback(async () => {
    if (!isAdmin) return
    
    setLoading(true)
    try {
      let query = supabase
        .from("admin_actions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
      
      // Apply filters
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter)
      }
      if (actorTypeFilter !== "all") {
        query = query.eq("actor_type", actorTypeFilter)
      }
      if (leagueFilter !== "all") {
        query = query.eq("league", leagueFilter)
      }
      if (searchTerm) {
        query = query.or(`actor_name.ilike.%${searchTerm}%,target_name.ilike.%${searchTerm}%,action_description.ilike.%${searchTerm}%`)
      }
      if (dateFrom) {
        query = query.gte("created_at", dateFrom)
      }
      if (dateTo) {
        // Add one day to include the full end date
        const endDate = new Date(dateTo)
        endDate.setDate(endDate.getDate() + 1)
        query = query.lt("created_at", endDate.toISOString())
      }
      
      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      setActivities(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase, isAdmin, categoryFilter, actorTypeFilter, leagueFilter, searchTerm, dateFrom, dateTo, page])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [categoryFilter, actorTypeFilter, leagueFilter, searchTerm, dateFrom, dateTo])

  const totalPages = Math.ceil(totalCount / pageSize)

  if (authLoading || (!isAdmin && !loading)) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Checking access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Activity Log
            </h1>
            <p className="text-muted-foreground">
              Track all admin and management actions across the league
            </p>
          </div>
        </div>
        <Button onClick={fetchActivities} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="space-y-2 lg:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actor Type */}
            <div className="space-y-2">
              <Label>Actor Type</Label>
              <Select value={actorTypeFilter} onValueChange={setActorTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTOR_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* League */}
            <div className="space-y-2">
              <Label>League</Label>
              <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAGUES.map((league) => (
                    <SelectItem key={league.value} value={league.value}>
                      {league.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2 lg:col-span-2 xl:col-span-1">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Clear filters */}
          {(searchTerm || categoryFilter !== "all" || actorTypeFilter !== "all" || leagueFilter !== "all" || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("all")
                setActorTypeFilter("all")
                setLeagueFilter("all")
                setDateFrom("")
                setDateTo("")
              }}
            >
              Clear all filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Recent Activity
              {totalCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({totalCount} total)
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>League</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          {getCategoryIcon(activity.category)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm truncate" title={activity.action_description || activity.action_type}>
                              {activity.action_description || activity.action_type}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{activity.actor_name || "Unknown"}</span>
                            {activity.actor_type && (
                              <Badge variant="outline" className="text-xs">
                                {activity.actor_type}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {activity.target_name || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getCategoryBadge(activity.category)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {activity.league || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(activity.created_at).toLocaleDateString()}{" "}
                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
