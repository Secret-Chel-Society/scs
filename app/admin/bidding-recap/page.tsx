"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import { 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  ArrowLeft 
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"

interface BiddingRecap {
  id: string
  player_name: string
  team_name: string
  final_bid: number
  winning_bidder: string
  total_bids: number
  created_at: string
  updated_at: string
}

export default function AdminBiddingRecapPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [biddingRecaps, setBiddingRecaps] = useState<BiddingRecap[]>([])
  const [filteredRecaps, setFilteredRecaps] = useState<BiddingRecap[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecap, setSelectedRecap] = useState<BiddingRecap | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPlayerName, setEditingPlayerName] = useState("")
  const [editingTeamName, setEditingTeamName] = useState("")
  const [editingFinalBid, setEditingFinalBid] = useState("")
  const [editingWinningBidder, setEditingWinningBidder] = useState("")
  const [updating, setUpdating] = useState(false)

  // Check if user is admin and load bidding recaps
  useEffect(() => {
    async function checkAuthAndLoadData() {
      if (!session?.user) {
        toast({
          title: "Unauthorized",
          description: "You must be logged in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      try {
        setLoading(true)

        // Check for Admin role
        const { data: adminRoleData, error: adminRoleError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "Admin")

        if (adminRoleError || !adminRoleData || adminRoleData.length === 0) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setIsAdmin(true)

        // Load bidding recaps
        const { data: recapsData, error: recapsError } = await supabase
          .from("bidding_recaps")
          .select("*")
          .order("created_at", { ascending: false })

        if (recapsError) throw recapsError

        setBiddingRecaps(recapsData || [])
        setFilteredRecaps(recapsData || [])
      } catch (error: any) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [supabase, session, toast, router])

  // Filter recaps based on search
  useEffect(() => {
    let filtered = biddingRecaps

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((recap) =>
        recap.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recap.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recap.winning_bidder.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredRecaps(filtered)
  }, [biddingRecaps, searchQuery])

  // Handle recap update
  const handleRecapUpdate = async () => {
    if (!selectedRecap) return

    try {
      setUpdating(true)

      const { error } = await supabase
        .from("bidding_recaps")
        .update({
          player_name: editingPlayerName,
          team_name: editingTeamName,
          final_bid: parseInt(editingFinalBid),
          winning_bidder: editingWinningBidder,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedRecap.id)

      if (error) throw error

      // Update local state
      setBiddingRecaps((prev) =>
        prev.map((recap) =>
          recap.id === selectedRecap.id
            ? { 
                ...recap, 
                player_name: editingPlayerName,
                team_name: editingTeamName,
                final_bid: parseInt(editingFinalBid),
                winning_bidder: editingWinningBidder
              }
            : recap
        )
      )

      toast({
        title: "Recap updated",
        description: `Bidding recap for ${editingPlayerName} has been updated.`,
      })

      setIsEditDialogOpen(false)
      setSelectedRecap(null)
    } catch (error: any) {
      console.error("Error updating recap:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update recap",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Get statistics
  const getStats = () => {
    const total = biddingRecaps.length
    const totalBids = biddingRecaps.reduce((sum, recap) => sum + recap.final_bid, 0)
    const avgBid = total > 0 ? Math.round(totalBids / total) : 0
    const maxBid = Math.max(...biddingRecaps.map(r => r.final_bid), 0)

    return { total, totalBids, avgBid, maxBid }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading bidding recaps...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <ArrowLeft className="h-5 w-5 text-white/70" />
            <Link href="/admin" className="text-white/70 hover:text-white transition-colors">
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Bidding Recap
              </h1>
              <p className="text-white/70 mt-1">View and manage bidding statistics and results</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        {/* Statistics */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-white/70 text-sm">Total Recaps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">${stats.totalBids.toLocaleString()}</div>
                <div className="text-white/70 text-sm">Total Bids</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">${stats.avgBid.toLocaleString()}</div>
                <div className="text-white/70 text-sm">Average Bid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">${stats.maxBid.toLocaleString()}</div>
                <div className="text-white/70 text-sm">Highest Bid</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-white">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="search"
                    placeholder="Search by player name, team, or bidder..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recaps Table */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Bidding Recaps</CardTitle>
            <CardDescription className="text-white/70">
              {filteredRecaps.length} recap{filteredRecaps.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/20 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white">Player</TableHead>
                    <TableHead className="text-white">Team</TableHead>
                    <TableHead className="text-white">Final Bid</TableHead>
                    <TableHead className="text-white">Winning Bidder</TableHead>
                    <TableHead className="text-white">Total Bids</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecaps.map((recap) => (
                    <TableRow key={recap.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{recap.player_name}</TableCell>
                      <TableCell className="text-white">{recap.team_name}</TableCell>
                      <TableCell className="text-white">${recap.final_bid.toLocaleString()}</TableCell>
                      <TableCell className="text-white">{recap.winning_bidder}</TableCell>
                      <TableCell className="text-white">{recap.total_bids}</TableCell>
                      <TableCell className="text-white">
                        {new Date(recap.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecap(recap)
                              setIsViewDialogOpen(true)
                            }}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecap(recap)
                              setEditingPlayerName(recap.player_name)
                              setEditingTeamName(recap.team_name)
                              setEditingFinalBid(recap.final_bid.toString())
                              setEditingWinningBidder(recap.winning_bidder)
                              setIsEditDialogOpen(true)
                            }}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRecaps.length === 0 && (
                    <TableRow className="border-white/20">
                      <TableCell colSpan={7} className="text-center py-8 text-white/50">
                        No bidding recaps found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Recap Details</DialogTitle>
              <DialogDescription className="text-white/70">
                View detailed information about this bidding recap
              </DialogDescription>
            </DialogHeader>
            {selectedRecap && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Player Name</Label>
                    <p className="text-white/70">{selectedRecap.player_name}</p>
                  </div>
                  <div>
                    <Label className="text-white">Team</Label>
                    <p className="text-white/70">{selectedRecap.team_name}</p>
                  </div>
                  <div>
                    <Label className="text-white">Final Bid</Label>
                    <p className="text-white/70">${selectedRecap.final_bid.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-white">Winning Bidder</Label>
                    <p className="text-white/70">{selectedRecap.winning_bidder}</p>
                  </div>
                  <div>
                    <Label className="text-white">Total Bids</Label>
                    <p className="text-white/70">{selectedRecap.total_bids}</p>
                  </div>
                  <div>
                    <Label className="text-white">Created Date</Label>
                    <p className="text-white/70">
                      {new Date(selectedRecap.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Recap</DialogTitle>
              <DialogDescription className="text-white/70">
                Update the bidding recap information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Player Name</Label>
                <Input
                  value={editingPlayerName}
                  onChange={(e) => setEditingPlayerName(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter player name"
                />
              </div>
              <div>
                <Label className="text-white">Team Name</Label>
                <Input
                  value={editingTeamName}
                  onChange={(e) => setEditingTeamName(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <Label className="text-white">Final Bid</Label>
                <Input
                  type="number"
                  value={editingFinalBid}
                  onChange={(e) => setEditingFinalBid(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter final bid amount"
                />
              </div>
              <div>
                <Label className="text-white">Winning Bidder</Label>
                <Input
                  value={editingWinningBidder}
                  onChange={(e) => setEditingWinningBidder(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter winning bidder"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecapUpdate}
                disabled={updating}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {updating ? "Updating..." : "Update Recap"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
