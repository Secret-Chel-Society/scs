"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Coins,
  TrendingUp,
  TrendingDown,
  History,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { authGet, authPost } from "@/lib/auth-fetch"

interface TokenTransaction {
  id: string
  amount: number
  transaction_type: string
  source: string
  description: string
  created_at: string
}

interface TokenRedeemable {
  id: string
  name: string
  description: string
  cost: number
  requires_approval: boolean
  category: string
  max_per_season: number | null
  is_active: boolean
}

interface TokenRedemption {
  id: string
  redeemable_id: string
  tokens_spent: number
  status: string
  notes: string
  created_at: string
  token_redeemables: TokenRedeemable
}

export function UserTokenDashboard() {
  const { supabase, session, isLoading: sessionLoading } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState<TokenTransaction[]>([])
  const [allTransactions, setAllTransactions] = useState<TokenTransaction[]>([])
  const [redeemables, setRedeemables] = useState<TokenRedeemable[]>([])
  const [redemptions, setRedemptions] = useState<TokenRedemption[]>([])
  const [selectedRedeemable, setSelectedRedeemable] = useState<TokenRedeemable | null>(null)
  const [redemptionNotes, setRedemptionNotes] = useState("")
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      loadTokenData()
    }
  }, [session, sessionLoading])

  const loadTokenData = async () => {
    try {
      setLoading(true)
      console.log("=== LOADING TOKEN DATA ===")
      console.log("Session user:", session?.user?.id)

      // Load token balance using authGet
      const { response: balanceResponse, data: balanceData } = await authGet("/api/tokens/balance")
      console.log("Balance response status:", balanceResponse.status)

      if (balanceResponse.ok) {
        console.log("Balance data received:", balanceData)
        setTokenBalance(balanceData.balance)
      } else {
        console.error("Balance fetch error:", balanceData)
        toast({
          title: "Error",
          description: "Failed to load token balance",
          variant: "destructive",
        })
      }

      // Load recent transactions
      const { response: transactionsResponse, data: transactionsData } = await authGet(
        "/api/tokens/transactions?limit=5",
      )
      if (transactionsResponse.ok) {
        setRecentTransactions(transactionsData.transactions)
      }

      // Load all transactions for history
      const { response: allTransactionsResponse, data: allTransactionsData } = await authGet(
        "/api/tokens/transactions?limit=100",
      )
      if (allTransactionsResponse.ok) {
        setAllTransactions(allTransactionsData.transactions)
      }

      // Load redeemables (this doesn't require auth)
      const redeemablesResponse = await fetch("/api/tokens/redeemables")
      if (redeemablesResponse.ok) {
        const redeemablesData = await redeemablesResponse.json()
        setRedeemables(redeemablesData.redeemables)
      }

      // Load user's redemptions
      if (session?.user) {
        const { data: redemptionsData, error: redemptionsError } = await supabase
          .from("token_redemptions")
          .select(`
            *,
            token_redeemables(*)
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })

        if (!redemptionsError && redemptionsData) {
          setRedemptions(redemptionsData)
        }
      }
    } catch (error) {
      console.error("Error loading token data:", error)
      toast({
        title: "Error",
        description: "Failed to load token data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    if (!selectedRedeemable) return

    setRedeeming(true)
    try {
      const { response, data } = await authPost("/api/tokens/redeem", {
        redeemable_id: selectedRedeemable.id,
        notes: redemptionNotes,
      })

      if (!response.ok) {
        throw new Error(data.error || "Failed to redeem")
      }

      toast({
        title: "Success",
        description: data.message,
      })

      setSelectedRedeemable(null)
      setRedemptionNotes("")
      loadTokenData() // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setRedeeming(false)
    }
  }

  const getCashoutProgress = () => {
    return Math.min((tokenBalance / 50) * 100, 100)
  }

  const getTransactionIcon = (transaction: TokenTransaction) => {
    if (transaction.amount > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />
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
            <AlertCircle className="h-3 w-3 mr-1" />
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

  if (sessionLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please log in to view your token dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Token Balance Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-yellow-500" />
            My Tokens
          </CardTitle>
          <CardDescription>Earn tokens through achievements and redeem them for rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-500 mb-2">{tokenBalance}</div>
            <p className="text-muted-foreground">Total Token Balance</p>
          </div>
        </CardContent>
      </Card>

      {/* Cashout Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Cashout Progress
          </CardTitle>
          <CardDescription>Progress toward $25 CAD cashout (50 tokens required)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={getCashoutProgress()} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{tokenBalance} / 50 tokens</span>
              <span>{Math.round(getCashoutProgress())}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="redeem">Redeem Tokens</TabsTrigger>
          <TabsTrigger value="history">Full History</TabsTrigger>
          <TabsTrigger value="redemptions">My Redemptions</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${transaction.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeem" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {redeemables.map((redeemable) => (
              <Card key={redeemable.id} className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">{redeemable.name}</CardTitle>
                  <CardDescription>{redeemable.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold">{redeemable.cost} tokens</span>
                    </div>
                    <Badge variant="outline">{redeemable.category}</Badge>
                  </div>

                  {/* Add limits information */}
                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                    {redeemable.max_per_season && (
                      <div className="flex justify-between">
                        <span>Max per season:</span>
                        <span className="font-medium">{redeemable.max_per_season}</span>
                      </div>
                    )}
                    {!redeemable.max_per_season && (
                      <div className="text-center">
                        <span>No season limit</span>
                      </div>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        disabled={tokenBalance < redeemable.cost}
                        onClick={() => setSelectedRedeemable(redeemable)}
                      >
                        {tokenBalance < redeemable.cost ? "Insufficient Tokens" : "Redeem"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Redeem {selectedRedeemable?.name}</DialogTitle>
                        <DialogDescription>
                          This will cost {selectedRedeemable?.cost} tokens.
                          {selectedRedeemable?.requires_approval && " This redemption requires admin approval."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="notes">Additional Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Any additional information..."
                            value={redemptionNotes}
                            onChange={(e) => setRedemptionNotes(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRedeemable(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleRedeem} disabled={redeeming}>
                          {redeeming ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                          Confirm Redemption
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {allTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No transaction history</p>
              ) : (
                <div className="space-y-2">
                  {allTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 border-b">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${transaction.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redemptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Redemptions</CardTitle>
            </CardHeader>
            <CardContent>
              {redemptions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No redemptions yet</p>
              ) : (
                <div className="space-y-3">
                  {redemptions.map((redemption) => (
                    <div key={redemption.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{redemption.token_redeemables.name}</h4>
                        {getStatusBadge(redemption.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{redemption.token_redeemables.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span>Cost: {redemption.tokens_spent} tokens</span>
                        <span>{new Date(redemption.created_at).toLocaleDateString()}</span>
                      </div>
                      {redemption.notes && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">
                          <strong>Notes:</strong> {redemption.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Make sure to export as default as well
export default UserTokenDashboard
