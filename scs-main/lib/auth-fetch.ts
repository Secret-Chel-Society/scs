"use client"
import { toast } from "sonner"
import { createCustomClient } from "./supabase/custom-client"

interface AuthFetchOptions extends RequestInit {
  showErrorToast?: boolean
}

/**
 * Makes an authenticated fetch request with the user's access token
 * @param url The URL to fetch
 * @param options Fetch options (method, body, etc.)
 * @returns Promise with the response and parsed data
 */
export async function authFetch(url: string, options: AuthFetchOptions = {}) {
  const { showErrorToast = true, ...fetchOptions } = options

  try {
    // Get the Supabase client
    const supabase = createCustomClient()

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      if (showErrorToast) {
        toast.error("You must be logged in to perform this action")
      }
      throw new Error("No authentication token available")
    }

    // Add the authorization header
    const headers = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
      Authorization: `Bearer ${session.access_token}`,
    }

    console.log("Making authenticated request to:", url)
    console.log("With headers:", { ...headers, Authorization: "Bearer [REDACTED]" })

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include",
    })

    console.log("Response status:", response.status)

    // Parse the response
    let data
    try {
      data = await response.json()
    } catch (parseError) {
      console.error("Error parsing response:", parseError)
      data = { error: "Invalid response format" }
    }

    // Return both response and data for flexibility
    return { response, data }
  } catch (error: any) {
    console.error(`Error in authFetch for ${url}:`, error)
    if (showErrorToast && !error.message.includes("Not authenticated")) {
      toast.error(error.message || "An error occurred")
    }
    throw error
  }
}

/**
 * Convenience method for authenticated POST requests
 */
export async function authPost(url: string, body: any, options: AuthFetchOptions = {}) {
  return authFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    ...options,
  })
}

/**
 * Convenience method for authenticated GET requests
 */
export async function authGet(url: string, options: AuthFetchOptions = {}) {
  return authFetch(url, {
    method: "GET",
    ...options,
  })
}

/**
 * Convenience method for authenticated PUT requests
 */
export async function authPut(url: string, body: any, options: AuthFetchOptions = {}) {
  return authFetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
    ...options,
  })
}

/**
 * Convenience method for authenticated DELETE requests
 */
export async function authDelete(url: string, options: AuthFetchOptions = {}) {
  return authFetch(url, {
    method: "DELETE",
    ...options,
  })
}
