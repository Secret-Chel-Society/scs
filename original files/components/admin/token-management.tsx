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
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Token Management</h2>
          <Button
            onClick={() => {
              console.log("Test button clicked")
              setAdjustTokensOpen(true)
              setSelectedUser(users[0] || null)
            }}
          >
            Test Modal
          </Button>
          <p className="text-muted-foreground">Manage player tokens, redeemables, and redemptions</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="redeemables">Redeemables</TabsTrigger>
          <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Player Token Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-48">
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
                  <SelectTrigger className="w-48">
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

              {/* Players Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Token Balance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.gamer_tag_id}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.team_logo && (
                            <img
                              src={user.team_logo || "/placeholder.svg"}
                              alt={user.team_name}
                              className="w-6 h-6 rounded"
                            />
                          )}
                          <span>{user.team_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.primary_position}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold">{user.token_balance}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openAdjustTokensModal(user)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Adjust
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openHistoryModal(user)}>
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeemables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Redeemable Items
                  </CardTitle>
                  <CardDescription>Manage items that players can redeem with tokens</CardDescription>
                </div>
                <Button onClick={openAddRedeemableModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {redeemables.map((redeemable) => (
                  <Card key={redeemable.id} className={!redeemable.is_active ? "opacity-50" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{redeemable.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditRedeemableModal(redeemable)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteRedeemable(redeemable.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>{redeemable.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Cost:</span>
                          <div className="flex items-center gap-1">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">{redeemable.cost}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Category:</span>
                          <Badge variant="outline">{redeemable.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Approval:</span>
                          <Badge variant={redeemable.requires_approval ? "destructive" : "secondary"}>
                            {redeemable.requires_approval ? "Required" : "Auto"}
                          </Badge>
                        </div>
                        {redeemable.max_per_season && (
                          <div className="flex items-center justify-between">
                            <span>Max/Season:</span>
                            <span>{redeemable.max_per_season}</span>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Redemption Requests
              </CardTitle>
              <CardDescription>Review and manage player redemption requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((redemption) => (
                    <TableRow key={redemption.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{redemption.users.gamer_tag_id}</div>
                          <div className="text-sm text-muted-foreground">{redemption.users.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{redemption.token_redeemables.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {redemption.token_redeemables.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span>{redemption.tokens_spent}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(redemption.status)}</TableCell>
                      <TableCell>{new Date(redemption.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {redemption.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateRedemption(redemption.id, "approved")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateRedemption(redemption.id, "denied")}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Token System Settings
              </CardTitle>
              <CardDescription>Configure global token system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Enable Token System</h4>
                    <p className="text-sm text-muted-foreground">Allow players to earn and spend tokens</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Enable Cashout</h4>
                    <p className="text-sm text-muted-foreground">Allow players to convert tokens to cash</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Cashout Rate</h4>
                    <p className="text-sm text-muted-foreground">Tokens required for $25 CAD</p>
                  </div>
                  <Input className="w-24" defaultValue="50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Token Adjustment Dialog */}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Tokens for {selectedUser?.gamer_tag_id}</DialogTitle>
            <DialogDescription>Current balance: {selectedUser?.token_balance} tokens</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={adjustmentType === "add" ? "default" : "outline"}
                onClick={() => setAdjustmentType("add")}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tokens
              </Button>
              <Button
                variant={adjustmentType === "subtract" ? "default" : "outline"}
                onClick={() => setAdjustmentType("subtract")}
                className="flex-1"
              >
                <Minus className="h-4 w-4 mr-2" />
                Subtract Tokens
              </Button>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter token amount"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Reason for adjustment (e.g., Won Player of the Week)"
                value={tokenReason}
                onChange={(e) => setTokenReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAdjustTokensModal}>
              Cancel
            </Button>
            <Button onClick={handleTokenAdjustment}>{adjustmentType === "add" ? "Add" : "Subtract"} Tokens</Button>
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
