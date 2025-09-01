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
  Coins, 
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

interface Token {
  id: string
  user_id: string
  token_type: string
  amount: number
  status: string
  created_at: string
  updated_at: string
  user?: {
    email: string
    gamer_tag_id: string
  }
}

interface RedemptionRequest {
  id: string
  user_id: string
  token_type: string
  amount: number
  status: string
  created_at: string
  updated_at: string
  user?: {
    email: string
    gamer_tag_id: string
  }
}

export default function AdminTokensPage() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [redemptionRequests, setRedemptionRequests] = useState<RedemptionRequest[]>([])
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const [filteredRequests, setFilteredRequests] = useState<RedemptionRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<RedemptionRequest | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAmount, setEditingAmount] = useState("")
  const [editingStatus, setEditingStatus] = useState("")
  const [updating, setUpdating] = useState(false)

  // Check if user is admin and load data
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

        // Load tokens with user data
        const { data: tokensData, error: tokensError } = await supabase
          .from("tokens")
          .select(`
            *,
            user:user_id (
              email,
              gamer_tag_id
            )
          `)
          .order("created_at", { ascending: false })

        if (tokensError) throw tokensError

        // Load redemption requests with user data
        const { data: requestsData, error: requestsError } = await supabase
          .from("redemption_requests")
          .select(`
            *,
            user:user_id (
              email,
              gamer_tag_id
            )
          `)
          .order("created_at", { ascending: false })

        if (requestsError) throw requestsError

        setTokens(tokensData || [])
        setFilteredTokens(tokensData || [])
        setRedemptionRequests(requestsData || [])
        setFilteredRequests(requestsData || [])
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

  // Filter data based on search
  useEffect(() => {
    let filteredT = tokens
    let filteredR = redemptionRequests

    // Filter by search query
    if (searchQuery) {
      filteredT = filteredT.filter((token) =>
        token.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.user?.gamer_tag_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.token_type.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      filteredR = filteredR.filter((request) =>
        request.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.user?.gamer_tag_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.token_type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredTokens(filteredT)
    setFilteredRequests(filteredR)
  }, [tokens, redemptionRequests, searchQuery])

  // Handle token update
  const handleTokenUpdate = async () => {
    if (!selectedToken) return

    try {
      setUpdating(true)

      const { error } = await supabase
        .from("tokens")
        .update({
          amount: parseInt(editingAmount),
          status: editingStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedToken.id)

      if (error) throw error

      // Update local state
      setTokens((prev) =>
        prev.map((token) =>
          token.id === selectedToken.id
            ? { ...token, amount: parseInt(editingAmount), status: editingStatus }
            : token
        )
      )

      toast({
        title: "Token updated",
        description: `Token for ${selectedToken.user?.gamer_tag_id} has been updated.`,
      })

      setIsEditDialogOpen(false)
      setSelectedToken(null)
    } catch (error: any) {
      console.error("Error updating token:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update token",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Handle request status update
  const handleRequestUpdate = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("redemption_requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (error) throw error

      // Update local state
      setRedemptionRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? { ...request, status: newStatus }
            : request
        )
      )

      toast({
        title: "Request updated",
        description: `Redemption request status updated to ${newStatus}.`,
      })
    } catch (error: any) {
      console.error("Error updating request:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      })
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "Pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Get statistics
  const getStats = () => {
    const totalTokens = tokens.length
    const totalRequests = redemptionRequests.length
    const pendingRequests = redemptionRequests.filter((r) => r.status === "Pending").length
    const totalTokenValue = tokens.reduce((sum, token) => sum + token.amount, 0)

    return { totalTokens, totalRequests, pendingRequests, totalTokenValue }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading tokens and redemption requests...</p>
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
              <Coins className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Token Management
              </h1>
              <p className="text-white/70 mt-1">Manage player tokens and redemption requests</p>
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
                <div className="text-2xl font-bold text-white">{stats.totalTokens}</div>
                <div className="text-white/70 text-sm">Total Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.totalTokenValue}</div>
                <div className="text-white/70 text-sm">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalRequests}</div>
                <div className="text-white/70 text-sm">Total Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.pendingRequests}</div>
                <div className="text-white/70 text-sm">Pending Requests</div>
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
                    placeholder="Search by email, gamer tag, or token type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokens Table */}
        <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Player Tokens</CardTitle>
            <CardDescription className="text-white/70">
              {filteredTokens.length} token{filteredTokens.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/20 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white">User</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white">Token Type</TableHead>
                    <TableHead className="text-white">Amount</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTokens.map((token) => (
                    <TableRow key={token.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{token.user?.gamer_tag_id || "N/A"}</TableCell>
                      <TableCell className="text-white">{token.user?.email || "N/A"}</TableCell>
                      <TableCell className="text-white">{token.token_type}</TableCell>
                      <TableCell className="text-white">{token.amount}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeVariant(token.status)}>
                          {token.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {new Date(token.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedToken(token)
                              setEditingAmount(token.amount.toString())
                              setEditingStatus(token.status)
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
                  {filteredTokens.length === 0 && (
                    <TableRow className="border-white/20">
                      <TableCell colSpan={7} className="text-center py-8 text-white/50">
                        No tokens found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Redemption Requests Table */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Redemption Requests</CardTitle>
            <CardDescription className="text-white/70">
              {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/20 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white">User</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white">Token Type</TableHead>
                    <TableHead className="text-white">Amount</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{request.user?.gamer_tag_id || "N/A"}</TableCell>
                      <TableCell className="text-white">{request.user?.email || "N/A"}</TableCell>
                      <TableCell className="text-white">{request.token_type}</TableCell>
                      <TableCell className="text-white">{request.amount}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === "Pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRequestUpdate(request.id, "Approved")}
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRequestUpdate(request.id, "Rejected")}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRequests.length === 0 && (
                    <TableRow className="border-white/20">
                      <TableCell colSpan={7} className="text-center py-8 text-white/50">
                        No redemption requests found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Token Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Token</DialogTitle>
              <DialogDescription className="text-white/70">
                Update the token amount and status
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Amount</Label>
                <Input
                  type="number"
                  value={editingAmount}
                  onChange={(e) => setEditingAmount(e.target.value)}
                  className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter token amount"
                />
              </div>
              <div>
                <Label className="text-white">Status</Label>
                <Select value={editingStatus} onValueChange={setEditingStatus}>
                  <SelectTrigger className="bg-slate-800/50 border-white/20 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="Active" className="text-white hover:bg-slate-700">Active</SelectItem>
                    <SelectItem value="Inactive" className="text-white hover:bg-slate-700">Inactive</SelectItem>
                    <SelectItem value="Pending" className="text-white hover:bg-slate-700">Pending</SelectItem>
                  </SelectContent>
                </Select>
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
                onClick={handleTokenUpdate}
                disabled={updating}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {updating ? "Updating..." : "Update Token"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
