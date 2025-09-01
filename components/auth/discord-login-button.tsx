"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { MessageSquare, Loader2 } from "lucide-react"

interface DiscordLoginButtonProps {
  className?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function DiscordLoginButton({
  className,
  onSuccess,
  onError,
}: DiscordLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDiscordLogin = async () => {
    try {
      setIsLoading(true)

      // Redirect to Discord OAuth
      window.location.href = "/api/auth/discord/login"
    } catch (error: any) {
      console.error("Discord login error:", error)
      const errorMessage = error.message || "Failed to initiate Discord login"
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })

      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDiscordLogin}
      disabled={isLoading}
      variant="outline"
      className={`w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-indigo-400/30 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting to Discord...
        </>
      ) : (
        <>
          <MessageSquare className="mr-2 h-4 w-4" />
          Continue with Discord
        </>
      )}
    </Button>
  )
}
