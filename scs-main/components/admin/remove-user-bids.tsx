"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function RemoveUserBids() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleRemoveBids = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to remove bids",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to remove all bids for user '${username}'?`)) {
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/remove-user-bids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({ username }),
      })

      // Log the response status for debugging
      console.log("API response status:", response.status)

      // Get the response text first for debugging
      const responseText = await response.text()
      console.log("API response text:", responseText)

      // Parse the JSON if possible
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
        throw new Error("Invalid response format from server")
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`User '${username}' not found. Please check the username and try again.`)
        } else {
          throw new Error(data.error || `Server returned ${response.status}: ${response.statusText}`)
        }
      }

      toast({
        title: "Bids removed",
        description: data.message || `All bids for user '${username}' have been removed`,
      })

      // Clear the input
      setUsername("")
    } catch (error: any) {
      console.error("Error removing bids:", error)
      toast({
        title: "Error removing bids",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Remove User Bids</CardTitle>
        <CardDescription>Remove all bids for a specific user</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleRemoveBids} disabled={isLoading || !username.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Remove Bids
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
