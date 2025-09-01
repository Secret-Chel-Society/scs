"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
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

export function NotificationsDropdown({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const supabase = createClientComponentClient<Database>()
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
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-4 cursor-default ${!notification.read ? "bg-primary/5" : ""}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex justify-between w-full">
                <span className="font-semibold">{notification.title}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(notification.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm mt-1">{notification.message}</p>
              {!notification.read && (
                <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  New
                </span>
              )}
            </DropdownMenuItem>
          ))
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
