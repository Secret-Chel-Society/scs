"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Check, X, AlertTriangle, Ban, Clock, CheckCircle, XCircle } from "lucide-react"

interface PlayerRelease {
  id: string
  player_id: string
  user_id: string
  team_id: string
  requesting_user_id: string
  reason: string
  status: "pending" | "approved" | "denied"
  admin_notes: string | null
  was_banned: boolean
  ban_reason: string | null
  processed_by: string | null
  processed_at: string | null
  created_at: string
  league?: "nhl" | "ahl" | "ecl"
  is_tc_release?: boolean
  players: {
    id: string
    salary: number
    users: {
      id: string
      gamer_tag_id: string
      discord_name: string
      email: string
    }
  }
  teams: {
    id: string
    name: string
    logo_url: string | null
  }
  requesting_user: {
    id: string
    gamer_tag_id: string
    discord_name: string
  }
  processed_by_user?: {
    id: string
    gamer_tag_id: string
    discord_name: string
  }
}

export default function PlayerReleasesPage() {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [releases, setReleases] = useState<PlayerRelease[]>([])
  const [activeTab, setActiveTab] = useState("pending")
  const [isAdmin, setIsAdmin] = useState(false)

  // Process dialog state
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [selectedRelease, setSelectedRelease] = useState<PlayerRelease | null>(null)
  const [processAction, setProcessAction] = useState<"approve" | "deny">("approve")
  const [adminNotes, setAdminNotes] = useState("")
  const [banPlayer, setBanPlayer] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    checkAdminAndLoad()
  }, [activeTab, session])

  const checkAdminAndLoad = async () => {
    try {
      if (!session?.user) {
        router.push("/login")
        return
      }

      // Use user_roles table which has proper RLS - check for Admin or Site Owner
      const { data: adminRoleData, error: adminRoleError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", session.user.id)
        .in("role", ["Admin", "Site Owner"])

      if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
        toast({
          title: "Access denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setIsAdmin(true)
      await loadReleases()
    } catch (error) {
      console.error("Error checking admin status:", error)
      router.push("/")
    }
  }

  const loadReleases = async () => {
    if (!session?.access_token) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/player-releases?status=${activeTab}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load releases")
      }

      setReleases(data.releases || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load release requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openProcessDialog = (release: PlayerRelease, action: "approve" | "deny") => {
    setSelectedRelease(release)
    setProcessAction(action)
    setAdminNotes("")
    setBanPlayer(false)
    setBanReason("")
    setProcessDialogOpen(true)
  }

  const processRelease = async () => {
    if (!selectedRelease || !session?.access_token) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/player-releases/${selectedRelease.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: processAction,
          admin_notes: adminNotes.trim() || null,
          ban_player: banPlayer,
          ban_reason: banPlayer ? banReason.trim() : null,
          league: selectedRelease.league || "nhl",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process release")
      }

      toast({
        title: "Success",
        description: data.message || `Release request ${processAction === "approve" ? "approved" : "denied"}`,
      })

      setProcessDialogOpen(false)
      await loadReleases()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process release request",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "approved":
        return <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case "denied":
        return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="h-3 w-3 mr-1" />Denied</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLeagueBadge = (league?: string) => {
    const label = (league || "nhl").toUpperCase()
    return <Badge variant="secondary" className="text-xs">{label}</Badge>
  }

  const getTcBadge = (isTc?: boolean) => {
    if (!isTc) return null
    return <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/50">Training Camp</Badge>
  }

  const pendingCount = releases.filter(r => r.status === "pending").length

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Player Releases</h1>
          <p className="text-muted-foreground">Review and process player release requests from teams</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="relative">
            Pending
            {activeTab !== "pending" && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : releases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No {activeTab === "all" ? "" : activeTab} release requests found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {releases.map((release) => (
                <Card key={release.id} className={release.status === "pending" ? "border-yellow-500/50" : ""}>
                  <CardContent className="p-4 md:p-6">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">
                            {release.players?.users?.gamer_tag_id || "Unknown Player"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {release.teams?.name || "Unknown Team"}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {getLeagueBadge(release.league)}
                            {getTcBadge(release.is_tc_release)}
                          </div>
                        </div>
                        {getStatusBadge(release.status)}
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">Reason:</p>
                        <p className="text-sm">{release.reason}</p>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Requested by: {release.requesting_user?.gamer_tag_id || "Unknown"}</p>
                        <p>Date: {formatDate(release.created_at)}</p>
                        {release.was_banned && (
                          <p className="text-red-500 flex items-center gap-1">
                            <Ban className="h-3 w-3" /> Player was banned
                          </p>
                        )}
                      </div>

                      {release.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-green-500 border-green-500/50 hover:bg-green-500/10"
                            onClick={() => openProcessDialog(release, "approve")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-500 border-red-500/50 hover:bg-red-500/10"
                            onClick={() => openProcessDialog(release, "deny")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Deny
                          </Button>
                        </div>
                      )}

                      {release.admin_notes && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-xs font-medium text-muted-foreground">Admin Notes:</p>
                          <p className="text-sm">{release.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:block">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {release.teams?.logo_url && (
                            <img
                              src={release.teams.logo_url}
                              alt={release.teams.name}
                              className="h-12 w-12 object-contain"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {release.players?.users?.gamer_tag_id || "Unknown Player"}
                              </h3>
                              {getStatusBadge(release.status)}
                              {getLeagueBadge(release.league)}
                              {getTcBadge(release.is_tc_release)}
                              {release.was_banned && (
                                <Badge variant="destructive" className="text-xs">
                                  <Ban className="h-3 w-3 mr-1" />
                                  Banned
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              From: <span className="font-medium">{release.teams?.name || "Unknown Team"}</span>
                              {" | "}
                              Requested by: <span className="font-medium">{release.requesting_user?.gamer_tag_id || "Unknown"}</span>
                              {" | "}
                              {formatDate(release.created_at)}
                            </p>
                            <div className="bg-muted/50 rounded-lg p-3 mb-3">
                              <p className="text-sm font-medium mb-1">Reason for Release:</p>
                              <p className="text-sm">{release.reason}</p>
                            </div>
                            {release.admin_notes && (
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <p className="text-sm font-medium mb-1 text-blue-400">Admin Notes:</p>
                                <p className="text-sm">{release.admin_notes}</p>
                                {release.processed_by_user && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Processed by: {release.processed_by_user.gamer_tag_id}
                                    {release.processed_at && ` on ${formatDate(release.processed_at)}`}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {release.status === "pending" && (
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                              onClick={() => openProcessDialog(release, "approve")}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                              onClick={() => openProcessDialog(release, "deny")}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Deny
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {processAction === "approve" ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  Approve Release
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-red-500" />
                  Deny Release
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {processAction === "approve" ? (
                <>
                  You are about to approve the release of{" "}
                  <span className="font-semibold text-foreground">
                    {selectedRelease?.players?.users?.gamer_tag_id}
                  </span>{" "}
                  from{" "}
                  <span className="font-semibold text-foreground">
                    {selectedRelease?.teams?.name}
                  </span>.
                </>
              ) : (
                <>
                  You are about to deny the release request for{" "}
                  <span className="font-semibold text-foreground">
                    {selectedRelease?.players?.users?.gamer_tag_id}
                  </span>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {processAction === "approve" && (
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                <p className="text-sm text-yellow-400 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    This will permanently remove the player from the team. They will not be able to be signed
                    again through free agency or bidding.
                  </span>
                </p>
              </div>
            )}

            {selectedRelease && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Original Reason:</p>
                <p className="text-sm">{selectedRelease.reason}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add any notes about this decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {processAction === "approve" && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="ban-player"
                    checked={banPlayer}
                    onCheckedChange={(checked) => setBanPlayer(checked as boolean)}
                  />
                  <Label
                    htmlFor="ban-player"
                    className="text-sm font-medium text-red-500 cursor-pointer flex items-center gap-2"
                  >
                    <Ban className="h-4 w-4" />
                    Also ban this player
                  </Label>
                </div>

                {banPlayer && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="ban-reason" className="text-sm">
                      Ban Reason <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="ban-reason"
                      placeholder="Provide a reason for banning this player..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setProcessDialogOpen(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant={processAction === "approve" ? "default" : "destructive"}
              onClick={processRelease}
              disabled={isProcessing || (banPlayer && !banReason.trim())}
              className="w-full sm:w-auto"
            >
              {isProcessing
                ? "Processing..."
                : processAction === "approve"
                ? banPlayer
                  ? "Approve & Ban"
                  : "Approve Release"
                : "Deny Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
