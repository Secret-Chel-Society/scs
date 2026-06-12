"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X } from "lucide-react"
import { useSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/types/database"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

// Check if notification is a contract offer
function isContractOfferNotification(notification: Notification): boolean {
  if (!notification.data) return false
  const data = notification.data as any
  return data?.type === "contract_offer" && data?.contract_offer_id
}

// Helper function to format trade notification messages
function formatNotificationMessage(title: string, message: string): string {
  // Check if this is a trade notification by looking for JSON-like content
  if (message.includes('"fromTeam"') || message.includes('"toTeam"') || message.includes("TRADE_DATA")) {
    try {
      // Try to extract JSON from the message
      let jsonStr = message

      // Handle messages that have a prefix before the JSON
      const jsonStartIndex = message.indexOf("{")
      if (jsonStartIndex > 0) {
        jsonStr = message.substring(jsonStartIndex)
      }

      // Remove TRADE_DATA: prefix if present
      if (jsonStr.includes("TRADE_DATA:")) {
        jsonStr = jsonStr.replace("TRADE_DATA:", "").trim()
      }

      const tradeData = JSON.parse(jsonStr)

      // Extract player names
      const fromPlayerNames =
        tradeData.fromPlayers?.map((p: any) => p.name || p.gamer_tag || "Unknown Player").join(", ") || ""
      const toPlayerNames =
        tradeData.toPlayers?.map((p: any) => p.name || p.gamer_tag || "Unknown Player").join(", ") || ""

      // Count picks
      const fromPicksCount = tradeData.fromPicks?.length || 0
      const toPicksCount = tradeData.toPicks?.length || 0

      // Build the offering side (what fromTeam is giving)
      const offeringParts: string[] = []
      if (fromPlayerNames) offeringParts.push(fromPlayerNames)
      if (fromPicksCount > 0) offeringParts.push(`${fromPicksCount} pick(s)`)
      const offering = offeringParts.length > 0 ? offeringParts.join(" and ") : "nothing"

      // Build the receiving side (what fromTeam wants)
      const receivingParts: string[] = []
      if (toPlayerNames) receivingParts.push(toPlayerNames)
      if (toPicksCount > 0) receivingParts.push(`${toPicksCount} pick(s)`)
      const receiving = receivingParts.length > 0 ? receivingParts.join(" and ") : "nothing"

      // Check for cancelled/response status
      if (tradeData.response === "CANCELLED" || message.includes("CANCELLED")) {
        return `Trade cancelled: ${offering} for ${receiving}`
      }

      // Determine direction based on title
      if (title.toLowerCase().includes("from")) {
        return `${tradeData.fromTeam || "Team"} wants to trade ${offering} for ${receiving}`
      } else {
        return `You proposed to trade ${offering} for ${receiving}`
      }
    } catch {
      // If JSON parsing fails, return a cleaned up version
      return message.replace(/\{.*\}/s, "Trade details available").substring(0, 100)
    }
  }

  return message
}

export function NotificationsDropdown({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const { supabase } = useSupabase()
  const { toast } = useToast()

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        toast({
          title: "Error loading notifications",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setNotifications(data || [])
        setUnreadCount(data?.filter((n) => !n.read).length || 0)
      }

      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching notifications:", err)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) return

    // Initial fetch
    fetchNotifications()

    // Set up polling instead of WebSocket
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
    setPollingInterval(interval)

    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [userId])

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

    if (error) {
      toast({
        title: "Error marking notification as read",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = async () => {
    if (notifications.length === 0) return

    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    const { error } = await supabase.from("notifications").update({ read: true }).in("id", unreadIds)

    if (error) {
      toast({
        title: "Error marking notifications as read",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  // Handle contract offer response (accept or reject)
  const handleContractResponse = async (notification: Notification, accept: boolean) => {
    const data = notification.data as any
    if (!data?.contract_offer_id) return

    try {
      // Update the contract offer status
      const { error: offerError } = await supabase
        .from("contract_offers")
        .update({ 
          status: accept ? "accepted" : "rejected",
          updated_at: new Date().toISOString()
        })
        .eq("id", data.contract_offer_id)

      if (offerError) throw offerError

      if (accept) {
        // Update the player's contract and team assignment
        const contractYears = data.contract_type === "2SZN" ? 2 : 1
        const isFranchise = data.contract_type === "FRANCHISE"
        
        const updates: any = {
          contract_type: data.contract_type === "FRANCHISE" ? "1SZN" : data.contract_type,
          contract_seasons_remaining: contractYears,
          salary: data.salary,
          has_franchise_tag: isFranchise,
          updated_at: new Date().toISOString()
        }

        // Set team based on league
        if (data.league === "NHL") {
          updates.team_id = data.team_id
        } else {
          updates.team_id_ahl = data.team_id
        }

        const { error: playerError } = await supabase
          .from("players")
          .update(updates)
          .eq("id", data.player_id)

        if (playerError) throw playerError
      }

      // Mark notification as read and update message
      await supabase
        .from("notifications")
        .update({ 
          read: true,
          message: accept 
            ? `You accepted the ${data.contract_type} contract from ${data.team_name || 'the team'} for $${data.salary?.toLocaleString()}.`
            : `You declined the contract offer from ${data.team_name || 'the team'}.`
        })
        .eq("id", notification.id)

      toast({
        title: accept ? "Contract Accepted!" : "Contract Declined",
        description: accept 
          ? `You've signed a ${data.contract_type} contract with ${data.team_name || 'the team'}!`
          : "You've declined the contract offer.",
      })

      // Refresh notifications
      fetchNotifications()
    } catch (error) {
      console.error("Error responding to contract:", error)
      toast({
        title: "Error",
        description: "Failed to process contract response",
        variant: "destructive",
      })
    }
  }

  if (!userId) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchNotifications} disabled={isLoading} className="h-8 px-2">
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8">
                Mark all as read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
        ) : (
          notifications.map((notification) => {
            const isContractOffer = isContractOfferNotification(notification)
            const offerData = notification.data as any
            
            return (
              <div
                key={notification.id}
                className={`flex flex-col items-start p-4 border-b last:border-b-0 ${!notification.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-sm">{notification.title}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mt-1 text-muted-foreground">{formatNotificationMessage(notification.title, notification.message)}</p>
                
                {/* Contract offer details and actions */}
                {isContractOffer && offerData && !notification.message.includes("accepted") && !notification.message.includes("declined") && (
                  <div className="mt-3 w-full space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{offerData.league}</Badge>
                      <Badge variant="secondary">{offerData.contract_type}</Badge>
                      <Badge variant="default">${offerData.salary?.toLocaleString()}</Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleContractResponse(notification, true)
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleContractResponse(notification, false)
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
                
                {!notification.read && !isContractOffer && (
                  <span 
                    className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full cursor-pointer"
                    onClick={() => markAsRead(notification.id)}
                  >
                    New
                  </span>
                )}
              </div>
            )
          })
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/notifications" className="w-full text-center cursor-pointer">
            View all notifications
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
