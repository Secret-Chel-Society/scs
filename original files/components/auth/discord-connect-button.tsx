"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { MessageSquare, Loader2, AlertTriangle } from "lucide-react"

interface DiscordConnectButtonProps {
  userId: string
  source?: "register" | "settings"
  className?: string
  onSuccess?: (discordId: string, discordUsername: string) => void
}

export default function DiscordConnectButton({
  userId,
  source = "settings",
  className,
  onSuccess,
}: DiscordConnectButtonProps) {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const connectDiscord = async () => {
    try {
      setConnecting(true)
      setError(null)

      // For registration flow, redirect directly
      if (source === "register") {
        const authUrl = `/api/auth/discord?user_id=registration&state=register`
        console.log("Redirecting to Discord OAuth:", authUrl)
        window.location.href = authUrl
        return
      }

      // For settings flow, use popup
      const finalUserId = userId
      const state = `${userId}:${source}`

      // Store the source in localStorage so we can handle the callback properly
      localStorage.setItem("discord_connect_source", source)
      localStorage.setItem("discord_connect_user_id", userId)

      const authUrl = `/api/auth/discord?user_id=${finalUserId}&state=${state}`
      console.log("Opening Discord OAuth popup:", authUrl)

      const popup = window.open(authUrl, "discord-connect", "width=500,height=600,scrollbars=yes,resizable=yes")

      if (!popup) {
        throw new Error("Failed to open popup window. Please check if popups are blocked.")
      }

      // Listen for the popup to close or send a message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          setConnecting(false)
          // Refresh the page to show updated Discord connection
          window.location.reload()
        }
      }, 1000)

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === "discord_connected") {
          clearInterval(checkClosed)
          popup?.close()
          setConnecting(false)
          if (onSuccess) {
            onSuccess(event.data.discord_id, event.data.discord_username)
          }
          // Refresh the page to show updated Discord connection
          window.location.reload()
        }
      }

      window.addEventListener("message", messageListener)

      // Cleanup
      setTimeout(() => {
        clearInterval(checkClosed)
        window.removeEventListener("message", messageListener)
        if (!popup?.closed) {
          popup?.close()
          setConnecting(false)
          setError("Connection timed out. Please try again.")
        }
      }, 300000) // 5 minutes timeout
    } catch (error: any) {
      console.error("Error connecting Discord:", error)
      setError(error.message || "Failed to connect to Discord")
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to Discord. Please try again.",
        variant: "destructive",
      })
      setConnecting(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
        <Button
          onClick={() => {
            setError(null)
            connectDiscord()
          }}
          variant="outline"
          className={className}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={connectDiscord} disabled={connecting} className={className}>
      {connecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <MessageSquare className="mr-2 h-4 w-4" />
          Connect Discord
        </>
      )}
    </Button>
  )
}
