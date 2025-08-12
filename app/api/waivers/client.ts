"use client"

import { toast } from "sonner"
import { authPost, authGet } from "@/lib/auth-fetch"

/**
 * Places a player on waivers
 * @param playerId The ID of the player to place on waivers
 * @returns Promise with the result of the waiver operation
 */
export async function placePlayerOnWaivers(playerId: string) {
  try {
    const { response, data } = await authPost("/api/waivers", { playerId })

    if (!response.ok) {
      throw new Error(data.error || "Failed to place player on waivers")
    }

    toast.success("Player successfully placed on waivers")
    return data
  } catch (error: any) {
    // Error handling is done in authPost, just re-throw
    throw error
  }
}

/**
 * Fetches the current waivers list
 * @param status Filter by waiver status (default: 'active')
 * @returns Promise with the waivers data
 */
export async function fetchWaivers(status = "active") {
  try {
    const { response, data } = await authGet(`/api/waivers?status=${status}`, {
      showErrorToast: false, // Don't show toast for fetch errors
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
