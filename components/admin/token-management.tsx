"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Coins,
  Plus,
  Minus,
  Edit,
  Trash2,
  Search,
  History,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Gift,
  Users,
  Settings,
  Trophy,
  Award,
  Medal,
  Star,
  Shield,
  Database,
  Zap,
  Target,
  AlertTriangle,
} from "lucide-react"

interface User {
  id: string
  email: string
  gamer_tag_id: string
  primary_position: string
  token_balance: number
  team_name: string
  team_logo: string | null
  role: string
}

interface TokenRedeemable {
  id: string
  name: string
  description: string
  cost: number
  requires_approval: boolean
  is_active: boolean
  category: string
  max_per_season: number | null
}

interface TokenRedemption {
  id: string
  user_id: string
  tokens_spent: number
  status: string
  notes: string
  created_at: string
  users: { gamer_tag_id: string; email: string }
  token_redeemables: { name: string; description: string; cost: number; category: string }
}

export function TokenManagement() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [redeemables, setRedeemables] = useState<TokenRedeemable[]>([])
  const [redemptions, setRedemptions] = useState<TokenRedemption[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")

  // Dialog states
  const [adjustTokensOpen, setAdjustTokensOpen] = useState(false)
  const [addRedeemableOpen, setAddRedeemableOpen] = useState(false)
  const [editRedeemableOpen, setEditRedeemableOpen] = useState(false)

  // History dialog state
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedUserHistory, setSelectedUserHistory] = useState<User | null>(null)
  const [userTransactions, setUserTransactions] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Token adjustment modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [tokenAmount, setTokenAmount] = useState("")
  const [tokenReason, setTokenReason] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add")

  // Add this after the dialog states
  console.log("Current dialog states:", {
    adjustTokensOpen,
    selectedUser: selectedUser?.gamer_tag_id,
    tokenAmount,
    tokenReason,
  })

  // Redeemable item modal state
  const [editingRedeemable, setEditingRedeemable] = useState<TokenRedeemable | null>(null)
  const [redeemableForm, setRedeemableForm] = useState({
    name: "",
    description: "",
    cost: "",
    requires_approval: true,
    category: "utility",
    max_per_season: "",
  })

  useEffect(() => {
    loadData()
  }, [searchTerm, selectedTeam, sortBy, sortOrder])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load users with token data
      const usersResponse = await fetch(
        `/api/admin/tokens/manage?search=${searchTerm}&team=${selectedTeam === "all" ? "" : selectedTeam}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      )
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users)
      }

      // Load redeemable items
      const redeemablesResponse = await fetch("/api/admin/tokens/redeemables")
      if (redeemablesResponse.ok) {
        const redeemablesData = await redeemablesResponse.json()
        setRedeemables(redeemablesData.redeemables)
      }

      // Load redemptions
      const redemptionsResponse = await fetch("/api/admin/tokens/redemptions")
      if (redemptionsResponse.ok) {
        const redemptionsData = await redemptionsResponse.json()
        setRedemptions(redemptionsData.redemptions)
      }
    } catch (error) {
      console.error("Error loading token management data:", error)
      toast({
        title: "Error",
        description: "Failed to load token management data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openAdjustTokensModal = (user: User) => {
    console.log("Opening adjust tokens modal for user:", user)
    setSelectedUser(user)
    setTokenAmount("")
    setTokenReason("")
    setAdjustmentType("add")
    setAdjustTokensOpen(true)
    console.log("Modal state set to open:", true)
  }

  const closeAdjustTokensModal = () => {
    setAdjustTokensOpen(false)
    setSelectedUser(null)
    setTokenAmount("")
    setTokenReason("")
  }

  const openAddRedeemableModal = () => {
    setRedeemableForm({
      name: "",
      description: "",
      cost: "",
      requires_approval: true,
      category: "utility",
      max_per_season: "",
    })
    setAddRedeemableOpen(true)
  }

  const closeAddRedeemableModal = () => {
    setAddRedeemableOpen(false)
    setRedeemableForm({
      name: "",
      description: "",
      cost: "",
      requires_approval: true,
      category: "utility",
      max_per_season: "",
    })
  }

  const openEditRedeemableModal = (redeemable: TokenRedeemable) => {
    setEditingRedeemable(redeemable)
    setRedeemableForm({
      name: redeemable.name,
      description: redeemable.description,
      cost: redeemable.cost.toString(),
      requires_approval: redeemable.requires_approval,
      category: redeemable.category,
      max_per_season: redeemable.max_per_season?.toString() || "",
    })
    setEditRedeemableOpen(true)
  }

  const closeEditRedeemableModal = () => {
    setEditRedeemableOpen(false)
    setEditingRedeemable(null)
    setRedeemableForm({
      name: "",
      description: "",
      cost: "",
      requires_approval: true,
      category: "utility",
      max_per_season: "",
    })
  }

  const openHistoryModal = async (user: User) => {
    setSelectedUserHistory(user)
    setHistoryOpen(true)
    setLoadingHistory(true)

    try {
      const response = await fetch(`/api/admin/tokens/transactions?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setUserTransactions(data.transactions || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load transaction history",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading transaction history:", error)
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  const closeHistoryModal = () => {
    setHistoryOpen(false)
    setSelectedUserHistory(null)
    setUserTransactions([])
  }

  const handleTokenAdjustment = async () => {
    if (!selectedUser || !tokenAmount || !tokenReason) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const amount = adjustmentType === "add" ? Number.parseInt(tokenAmount) : -Number.parseInt(tokenAmount)

      const response = await fetch("/api/admin/tokens/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          amount,
          source: "admin",
          description: tokenReason,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to adjust tokens")
      }

      toast({
        title: "Success",
        description: `${adjustmentType === "add" ? "Added" : "Subtracted"} ${tokenAmount} tokens`,
      })

      closeAdjustTokensModal()
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCreateRedeemable = async () => {
    if (!redeemableForm.name || !redeemableForm.description || !redeemableForm.cost) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/tokens/redeemables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...redeemableForm,
          cost: Number.parseInt(redeemableForm.cost),
          max_per_season: redeemableForm.max_per_season ? Number.parseInt(redeemableForm.max_per_season) : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create redeemable item")
      }

      toast({
        title: "Success",
        description: "Redeemable item created successfully",
      })

      closeAddRedeemableModal()
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateRedeemable = async () => {
    if (!editingRedeemable || !redeemableForm.name || !redeemableForm.description || !redeemableForm.cost) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/tokens/redeemables", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingRedeemable.id,
          ...redeemableForm,
          cost: Number.parseInt(redeemableForm.cost),
          max_per_season: redeemableForm.max_per_season ? Number.parseInt(redeemableForm.max_per_season) : null,
          is_active: editingRedeemable.is_active,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update redeemable item")
      }

      toast({
        title: "Success",
        description: "Redeemable item updated successfully",
      })

      closeEditRedeemableModal()
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteRedeemable = async (redeemableId: string) => {
    if (!confirm("Are you sure you want to delete this redeemable item?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tokens/redeemables?id=${redeemableId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete redeemable item")
      }

      toast({
        title: "Success",
        description: "Redeemable item deleted successfully",
      })

      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateRedemption = async (redemptionId: string, status: string, notes?: string) => {
    try {
      const response = await fetch("/api/admin/tokens/redemptions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: redemptionId,
          status,
          notes,
          admin_user_id: "admin", // You might want to get the actual admin user ID
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update redemption")
      }

      toast({
        title: "Success",
        description: `Redemption ${status}`,
      })

      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "denied":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Denied
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const uniqueTeams = Array.from(new Set(users.map((user) => user.team_name))).sort()

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="p-4 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-lg">
          <RefreshCw className="h-8 w-8 text-white animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">Loading Token Management</h3>
          <p className="text-hockey-silver-600 dark:text-hockey-silver-400">Gathering player and token data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl shadow-lg">
            <Coins className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">Token Management</h2>
            <p className="text-hockey-silver-600 dark:text-hockey-silver-400 text-lg">Manage player tokens, redeemables, and redemptions</p>
          </div>
        </div>
        <Button 
          onClick={loadData} 
          className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="players" className="w-full">
        <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg rounded-xl p-2">
          <TabsList className="grid w-full grid-cols-4 bg-transparent">
            <TabsTrigger 
              value="players" 
              className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Users className="h-4 w-4 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger 
              value="redeemables" 
              className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Gift className="h-4 w-4 mr-2" />
              Redeemables
            </TabsTrigger>
            <TabsTrigger 
              value="redemptions" 
              className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-goal-red-500 data-[state=active]:to-goal-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Redemptions
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-hockey-silver-500 data-[state=active]:to-hockey-silver-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="players" className="space-y-4">
          {/* Enhanced Filters */}
          <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Player Token Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400 z-10" />
                    <Input
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="hockey-search pl-10 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
                    />
                  </div>
                </div>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="hockey-search w-48 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {uniqueTeams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="hockey-search w-48 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="tokens">Token Balance</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="position">Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enhanced Players Table */}
              <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 rounded-xl overflow-hidden shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-ice-blue-50/50 to-rink-blue-50/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Player</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Team</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Position</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Token Balance</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className="hover:bg-gradient-to-r hover:from-ice-blue-50/30 hover:to-rink-blue-50/30 dark:hover:from-ice-blue-900/10 dark:hover:to-rink-blue-900/10 transition-all duration-300 border-b border-ice-blue-200/30 dark:border-rink-blue-700/30"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{user.gamer_tag_id}</div>
                            <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.team_logo && (
                              <img
                                src={user.team_logo || "/placeholder.svg"}
                                alt={user.team_name}
                                className="w-6 h-6 rounded border border-ice-blue-200/50 dark:border-rink-blue-700/50"
                              />
                            )}
                            <span className="text-hockey-silver-800 dark:text-hockey-silver-200">{user.team_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-ice-blue-300 dark:border-rink-blue-600 text-ice-blue-700 dark:text-rink-blue-300">
                            {user.primary_position}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded">
                              <Coins className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                            </div>
                            <span className="font-bold text-ice-blue-700 dark:text-ice-blue-300">{user.token_balance}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openAdjustTokensModal(user)}
                              className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adjust
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openHistoryModal(user)}
                              className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeemables" className="space-y-4">
          <Card className="hockey-card hockey-card-hover border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-assist-green-200/50 dark:border-assist-green-700/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <div className="p-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded-lg">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                    Redeemable Items
                  </CardTitle>
                  <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Manage items that players can redeem with tokens</CardDescription>
                </div>
                <Button 
                  onClick={openAddRedeemableModal}
                  className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {redeemables.map((redeemable) => (
                  <Card 
                    key={redeemable.id} 
                    className={`hockey-card hockey-card-hover border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20 shadow-lg hover:shadow-xl transition-all duration-300 ${!redeemable.is_active ? "opacity-50" : ""}`}
                  >
                    <CardHeader className="border-b border-assist-green-200/50 dark:border-assist-green-700/50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-hockey-silver-800 dark:text-hockey-silver-200">{redeemable.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditRedeemableModal(redeemable)}
                            className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteRedeemable(redeemable.id)}
                            className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">{redeemable.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                          <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">Cost:</span>
                          <div className="flex items-center gap-1">
                            <div className="p-1 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded">
                              <Coins className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                            </div>
                            <span className="font-bold text-ice-blue-700 dark:text-ice-blue-300">{redeemable.cost}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-rink-blue-100/30 to-rink-blue-100/30 dark:from-rink-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-rink-blue-200/30 dark:border-rink-blue-700/30">
                          <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">Category:</span>
                          <Badge variant="outline" className="border-rink-blue-300 dark:border-rink-blue-600 text-rink-blue-700 dark:text-rink-blue-300">{redeemable.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-goal-red-100/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-900/10 rounded-lg border border-goal-red-200/30 dark:border-goal-red-700/30">
                          <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">Approval:</span>
                          <Badge 
                            variant={redeemable.requires_approval ? "destructive" : "secondary"}
                            className={redeemable.requires_approval ? "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white border-0" : "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white border-0"}
                          >
                            {redeemable.requires_approval ? "Required" : "Auto"}
                          </Badge>
                        </div>
                        {redeemable.max_per_season && (
                          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-hockey-silver-100/30 to-hockey-silver-100/30 dark:from-hockey-silver-900/10 dark:to-hockey-silver-900/10 rounded-lg border border-hockey-silver-200/30 dark:border-hockey-silver-700/30">
                            <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-medium">Max/Season:</span>
                            <span className="text-hockey-silver-800 dark:text-hockey-silver-200 font-semibold">{redeemable.max_per_season}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redemptions" className="space-y-4">
          <Card className="hockey-card hockey-card-hover border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-goal-red-200/50 dark:border-goal-red-700/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                Redemption Requests
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Review and manage player redemption requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="hockey-card border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20 rounded-xl overflow-hidden shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-goal-red-50/50 to-goal-red-50/50 dark:from-goal-red-900/20 dark:to-goal-red-900/20 border-b-2 border-goal-red-200/50 dark:border-goal-red-700/50">
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Player</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Item</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Cost</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Status</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Date</TableHead>
                      <TableHead className="text-hockey-silver-800 dark:text-hockey-silver-200 font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map((redemption) => (
                      <TableRow 
                        key={redemption.id}
                        className="hover:bg-gradient-to-r hover:from-goal-red-50/30 hover:to-goal-red-50/30 dark:hover:from-goal-red-900/10 dark:hover:to-goal-red-900/10 transition-all duration-300 border-b border-goal-red-200/30 dark:border-goal-red-700/30"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{redemption.users.gamer_tag_id}</div>
                            <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">{redemption.users.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{redemption.token_redeemables.name}</div>
                            <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">
                              {redemption.token_redeemables.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div className="p-1 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded">
                              <Coins className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                            </div>
                            <span className="font-bold text-ice-blue-700 dark:text-ice-blue-300">{redemption.tokens_spent}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(redemption.status)}</TableCell>
                        <TableCell className="text-hockey-silver-800 dark:text-hockey-silver-200">{new Date(redemption.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {redemption.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateRedemption(redemption.id, "approved")}
                                className="hockey-button bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateRedemption(redemption.id, "denied")}
                                className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Deny
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="hockey-card hockey-card-hover border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b-2 border-hockey-silver-200/50 dark:border-hockey-silver-700/50 pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
                <div className="p-2 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                Token System Settings
              </CardTitle>
              <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Configure global token system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-ice-blue-100/30 to-rink-blue-100/30 dark:from-ice-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-ice-blue-200/30 dark:border-rink-blue-700/30">
                  <div>
                    <h4 className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Enable Token System</h4>
                    <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Allow players to earn and spend tokens</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-ice-blue-500 data-[state=checked]:to-rink-blue-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                  <div>
                    <h4 className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Enable Cashout</h4>
                    <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Allow players to convert tokens to cash</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-assist-green-500 data-[state=checked]:to-assist-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-goal-red-100/30 to-goal-red-100/30 dark:from-goal-red-900/10 dark:to-goal-red-900/10 rounded-lg border border-goal-red-200/30 dark:border-goal-red-700/30">
                  <div>
                    <h4 className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Cashout Rate</h4>
                    <p className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">Tokens required for $25 CAD</p>
                  </div>
                  <Input 
                    className="hockey-search w-24 border-2 border-goal-red-200/50 dark:border-goal-red-700/50 focus:border-goal-red-500 dark:focus:border-goal-red-500 focus:ring-4 focus:ring-goal-red-500/20 dark:focus:ring-goal-red-500/20 transition-all duration-300" 
                    defaultValue="50" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Token Adjustment Dialog */}
      <Dialog
        open={adjustTokensOpen}
        onOpenChange={(open) => {
          console.log("Dialog onOpenChange called with:", open)
          setAdjustTokensOpen(open)
          if (!open) {
            closeAdjustTokensModal()
          }
        }}
        key={selectedUser?.id || "no-user"}
      >
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-ice-blue-50 to-rink-blue-50 dark:from-hockey-silver-900 dark:to-rink-blue-900 border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 shadow-2xl shadow-ice-blue-500/20">
          <DialogHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
            <DialogTitle className="text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
                <Coins className="h-6 w-6 text-white" />
              </div>
              Adjust Tokens for {selectedUser?.gamer_tag_id}
            </DialogTitle>
            <DialogDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">
              Current balance: <span className="font-semibold text-ice-blue-700 dark:text-ice-blue-300">{selectedUser?.token_balance} tokens</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={adjustmentType === "add" ? "default" : "outline"}
                onClick={() => setAdjustmentType("add")}
                className={`flex-1 hockey-button ${adjustmentType === "add" ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" : "border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 hover:bg-gradient-to-r hover:from-assist-green-500 hover:to-assist-green-600 hover:text-white hover:border-0 hover:shadow-lg hover:scale-105 transition-all duration-300"}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tokens
              </Button>
              <Button
                variant={adjustmentType === "subtract" ? "default" : "outline"}
                onClick={() => setAdjustmentType("subtract")}
                className={`flex-1 hockey-button ${adjustmentType === "subtract" ? "bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" : "border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 hover:bg-gradient-to-r hover:from-goal-red-500 hover:to-goal-red-600 hover:text-white hover:border-0 hover:shadow-lg hover:scale-105 transition-all duration-300"}`}
              >
                <Minus className="h-4 w-4 mr-2" />
                Subtract Tokens
              </Button>
            </div>
            <div>
              <Label htmlFor="amount" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <Coins className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter token amount"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
              />
            </div>
            <div>
              <Label htmlFor="reason" className="text-base font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                <Settings className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                Reason
              </Label>
              <Textarea
                id="reason"
                placeholder="Reason for adjustment (e.g., Won Player of the Week)"
                value={tokenReason}
                onChange={(e) => setTokenReason(e.target.value)}
                className="hockey-search border-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:border-ice-blue-500 dark:focus:border-rink-blue-500 focus:ring-4 focus:ring-ice-blue-500/20 dark:focus:ring-rink-blue-500/20 transition-all duration-300"
              />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t-2 border-ice-blue-200/50 dark:border-rink-blue-700/50">
            <Button 
              variant="outline" 
              onClick={closeAdjustTokensModal}
              className="hockey-button bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 hover:from-hockey-silver-600 hover:to-hockey-silver-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTokenAdjustment}
              className={`hockey-button ${adjustmentType === "add" ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 hover:from-assist-green-600 hover:to-assist-green-700" : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700"} text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300`}
            >
              {adjustmentType === "add" ? "Add" : "Subtract"} Tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Redeemable Dialog */}
      <Dialog open={addRedeemableOpen} onOpenChange={setAddRedeemableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Redeemable Item</DialogTitle>
            <DialogDescription>Add a new item that players can redeem with tokens</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Item name"
                value={redeemableForm.name}
                onChange={(e) => setRedeemableForm({ ...redeemableForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Item description"
                value={redeemableForm.description}
                onChange={(e) => setRedeemableForm({ ...redeemableForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost">Cost (tokens)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="Token cost"
                  value={redeemableForm.cost}
                  onChange={(e) => setRedeemableForm({ ...redeemableForm, cost: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={redeemableForm.category}
                  onValueChange={(value) => setRedeemableForm({ ...redeemableForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={redeemableForm.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="tournament">Tournament</SelectItem>
                    <SelectItem value="cashout">Cashout</SelectItem>
                    <SelectItem value="cosmetic">Cosmetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="max_per_season">Max per season (optional)</Label>
              <Input
                id="max_per_season"
                type="number"
                placeholder="Leave empty for unlimited"
                value={redeemableForm.max_per_season}
                onChange={(e) => setRedeemableForm({ ...redeemableForm, max_per_season: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="requires_approval"
                checked={redeemableForm.requires_approval}
                onCheckedChange={(checked) => setRedeemableForm({ ...redeemableForm, requires_approval: checked })}
              />
              <Label htmlFor="requires_approval">Requires admin approval</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddRedeemableModal}>
              Cancel
            </Button>
            <Button onClick={handleCreateRedeemable}>Create Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Redeemable Dialog */}
      <Dialog open={editRedeemableOpen} onOpenChange={setEditRedeemableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Redeemable Item</DialogTitle>
            <DialogDescription>Update the redeemable item details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="Item name"
                value={redeemableForm.name}
                onChange={(e) => setRedeemableForm({ ...redeemableForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Item description"
                value={redeemableForm.description}
                onChange={(e) => setRedeemableForm({ ...redeemableForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-cost">Cost (tokens)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  placeholder="Token cost"
                  value={redeemableForm.cost}
                  onChange={(e) => setRedeemableForm({ ...redeemableForm, cost: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={redeemableForm.category}
                  onValueChange={(value) => setRedeemableForm({ ...redeemableForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={redeemableForm.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="tournament">Tournament</SelectItem>
                    <SelectItem value="cashout">Cashout</SelectItem>
                    <SelectItem value="cosmetic">Cosmetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-max_per_season">Max per season (optional)</Label>
              <Input
                id="edit-max_per_season"
                type="number"
                placeholder="Leave empty for unlimited"
                value={redeemableForm.max_per_season}
                onChange={(e) => setRedeemableForm({ ...redeemableForm, max_per_season: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-requires_approval"
                checked={redeemableForm.requires_approval}
                onCheckedChange={(checked) => setRedeemableForm({ ...redeemableForm, requires_approval: checked })}
              />
              <Label htmlFor="edit-requires_approval">Requires admin approval</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditRedeemableModal}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRedeemable}>Update Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Token History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Token History - {selectedUserHistory?.gamer_tag_id}</DialogTitle>
            <DialogDescription>Complete transaction history for this player</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Balance After</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      userTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.created_at).toLocaleDateString()}{" "}
                            {new Date(transaction.created_at).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.transaction_type === "earned" ? "default" : "secondary"}>
                              {transaction.transaction_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`flex items-center gap-1 ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              <Coins className="h-4 w-4" />
                              <span className="font-bold">
                                {transaction.amount > 0 ? "+" : ""}
                                {transaction.amount}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transaction.source}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={transaction.description}>
                            {transaction.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Coins className="h-4 w-4 text-yellow-500" />
                              <span>{transaction.balance_after || "N/A"}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeHistoryModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
