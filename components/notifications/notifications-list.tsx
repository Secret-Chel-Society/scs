"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSupabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { Bell, Check, X, AlertCircle, Info, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  created_at: string
  action_url?: string
  action_text?: string
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

export function NotificationsList() {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) {
          console.error("Error fetching notifications:", error)
          setError("Failed to load notifications")
          setLoading(false)
          return
        }

        setNotifications(data || [])
        setLoading(false)
      } catch (err: any) {
        console.error("Error in fetchNotifications:", err)
        setError("Failed to load notifications")
        setLoading(false)
      }
    }

    fetchNotifications()

    // Set up real-time subscription for notifications
    const notificationsSubscription = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("Notification subscription event:", payload)
          if (payload.new) {
            setNotifications((current) => [payload.new as Notification, ...current].slice(0, 10))
          }
          if (payload.eventType === "UPDATE" && payload.new) {
            setNotifications((current) =>
              current.map((notif) => (notif.id === payload.new.id ? (payload.new as Notification) : notif)),
            )
          }
          if (payload.eventType === "DELETE" && payload.old) {
            setNotifications((current) => current.filter((notif) => notif.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notificationsSubscription)
    }
  }, [supabase])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      if (error) {
        console.error("Error marking notification as read:", error)
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive",
        })
        return
      }

      setNotifications((current) =>
        current.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)),
      )
    } catch (err: any) {
      console.error("Error in markAsRead:", err)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (error) {
        console.error("Error deleting notification:", error)
        toast({
          title: "Error",
          description: "Failed to delete notification",
          variant: "destructive",
        })
        return
      }

      setNotifications((current) => current.filter((notif) => notif.id !== notificationId))

      toast({
        title: "Success",
        description: "Notification deleted",
      })
    } catch (err: any) {
      console.error("Error in deleteNotification:", err)
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getNotificationBadgeVariant = (type: string) => {
    switch (type) {
      case "success":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Your recent notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Your recent notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Your recent notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Your recent notifications ({notifications.length})</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/notifications">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                notification.read ? "bg-muted/30" : "bg-background"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-medium ${notification.read ? "text-muted-foreground" : "text-foreground"}`}
                    >
                      {notification.title}
                    </h4>
                    <p
                      className={`text-sm mt-1 ${notification.read ? "text-muted-foreground" : "text-muted-foreground"}`}
                    >
                      {formatNotificationMessage(notification.title, notification.message)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                        {notification.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {notification.action_url && notification.action_text && (
                      <Button variant="link" size="sm" className="p-0 h-auto mt-2" asChild>
                        <Link href={notification.action_url}>{notification.action_text}</Link>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
