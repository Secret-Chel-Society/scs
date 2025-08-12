"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Link } from "lucide-react"
import { useSupabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { linkify } from "@/lib/link-utils"

interface TeamChatMessage {
  id: string
  message: string
  created_at: string
  users: {
    id: string
    gamer_tag_id: string
    avatar_url: string | null
  }
}

interface TeamChatModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  teamName: string
  teamLogo?: string | null
}

// Component to render message with links
function MessageContent({ message }: { message: string }) {
  const linkedMessage = linkify(message)

  return <div className="text-sm mt-1 break-words" dangerouslySetInnerHTML={{ __html: linkedMessage }} />
}

export function TeamChatModal({ isOpen, onClose, teamId, teamName, teamLogo }: TeamChatModalProps) {
  const [messages, setMessages] = useState<TeamChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { supabase, session } = useSupabase()

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen && teamId) {
      console.log("=== TEAM CHAT MODAL DEBUG ===")
      console.log("Opening chat for team:", teamId)
      console.log("Session:", !!session)

      fetchMessages()

      // Subscribe to real-time updates
      const channel = supabase
        .channel(`team-chat-${teamId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "team_chat_messages",
            filter: `team_id=eq.${teamId}`,
          },
          (payload) => {
            console.log("Real-time message received:", payload)
            // Fetch the complete message with user data
            fetchNewMessage(payload.new.id)
          },
        )
        .subscribe()

      console.log("Subscribed to real-time channel:", `team-chat-${teamId}`)

      return () => {
        console.log("Unsubscribing from real-time channel")
        supabase.removeChannel(channel)
      }
    }
  }, [isOpen, teamId, supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      // Add a class to body to help with styling
      document.body.classList.add("modal-open")
    } else {
      document.body.style.overflow = "unset"
      document.body.classList.remove("modal-open")
    }

    return () => {
      document.body.style.overflow = "unset"
      document.body.classList.remove("modal-open")
    }
  }, [isOpen])

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`
      console.log("Using Bearer token for auth")
    } else {
      console.log("No access token, using cookies")
    }

    return headers
  }

  const fetchMessages = async () => {
    console.log("Fetching messages for team:", teamId)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/team-chat/messages?teamId=${teamId}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      })

      console.log("Fetch response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Fetched messages:", data.messages?.length || 0)
        setMessages(data.messages || [])
      } else {
        const errorData = await response.json()
        console.error("Error fetching messages:", errorData)
        toast.error("Failed to load messages.")
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast.error("Failed to load messages.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNewMessage = async (messageId: string) => {
    console.log("Fetching new message:", messageId)
    try {
      const { data, error } = await supabase
        .from("team_chat_messages")
        .select(`
          id,
          message,
          created_at,
          user_id
        `)
        .eq("id", messageId)
        .single()

      if (error) {
        console.error("Error fetching new message:", error)
        return
      }

      if (data) {
        // Get user info
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, gamer_tag_id, avatar_url")
          .eq("id", data.user_id)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError)
          return
        }

        const messageWithUser = {
          ...data,
          users: userData || {
            id: data.user_id,
            gamer_tag_id: "Unknown User",
            avatar_url: null,
          },
        }

        console.log("Adding new message to state:", messageWithUser)

        setMessages((prev) => {
          // Check if message already exists
          if (prev.some((msg) => msg.id === messageWithUser.id)) {
            console.log("Message already exists, skipping")
            return prev
          }
          console.log("Adding message to list")
          return [...prev, messageWithUser]
        })
      }
    } catch (error) {
      console.error("Error fetching new message:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    console.log("Sending message:", newMessage.trim())
    setIsSending(true)

    try {
      const response = await fetch("/api/team-chat/messages", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          teamId,
          message: newMessage.trim(),
        }),
      })

      console.log("Send response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Send error:", errorData)
        throw new Error(errorData?.error || "Failed to send message")
      }

      const data = await response.json()
      console.log("Message sent successfully:", data.message)

      if (data.message) {
        setNewMessage("")

        // Immediately add the message to the UI for better UX
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === data.message.id)) {
            return prev
          }
          return [...prev, data.message]
        })

        toast.success("Message sent!")
      }
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error(error.message || "Failed to send message.")
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div
      className="team-chat-modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="bg-background border rounded-lg shadow-2xl w-full max-w-md h-[600px] flex flex-col"
        style={{
          position: "relative",
          zIndex: 999999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            {teamLogo && <img src={teamLogo || "/placeholder.svg"} alt={teamName} className="w-6 h-6 rounded-full" />}
            <h3 className="font-semibold">{teamName} Team Chat</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No messages yet. Start the conversation!</p>
                  <p className="text-xs mt-2 opacity-75">
                    <Link className="inline w-3 h-3 mr-1" />
                    Links will be automatically clickable
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.users.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {message.users.gamer_tag_id?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{message.users.gamer_tag_id}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <MessageContent message={message.message} />
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write something... (links will be clickable)"
              className="flex-1"
              maxLength={500}
              disabled={isSending}
            />
            <Button type="submit" size="sm" disabled={!newMessage.trim() || isSending}>
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  // Use React Portal to render modal at document.body level
  return createPortal(modalContent, document.body)
}
