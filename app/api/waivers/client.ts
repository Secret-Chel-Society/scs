"use client"

import { toast } from "sonner"
import { authPost } from "@/lib/auth-fetch"

export async function placePlayerOnWaivers(playerId: string) {
  try {
    const { response, data } = await authPost(
      "/api/waivers", 
      { playerId },
      { showErrorToast: true, handleAuthError: true }
    )

    if (!response.ok) {
      const error = data?.error || "Failed to place player on waivers"
      throw new Error(error)
    }

    toast.success("Player successfully placed on waivers")
    return data
  } catch (error: any) {
    if (error.status === 401) {
      toast.error("Authentication failed. Please try again.")
    } else {
      console.error("Error placing player on waivers:", error)
      toast.error(error.message || "Failed to place player on waivers")
    }
    throw error
  }
}

export async function fetchWaivers(status = "active") {
  try {
    const { response, data } = await authGet(`/api/waivers?status=${status}`, {
      showErrorToast: false,
    })

    if (!response.ok) {
      console.error("Error fetching waivers:", data.error)
      return { waivers: [] }
    }

    return data
  } catch (error) {
    console.error("Error fetching waivers:", error)
    return { waivers: [] }
  }
}