/**
 * Helper function to make authenticated fetch requests to API routes
 * This ensures the auth token is included in the request
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  try {
    // Get the current session from localStorage
    const supabaseAuthKey = "sb-" + process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "") + "-auth-token"
    const authData = localStorage.getItem(supabaseAuthKey)

    if (!authData) {
      throw new Error("No authentication data found")
    }

    // Parse the auth data to get the access token
    const parsedAuthData = JSON.parse(authData)
    const accessToken = parsedAuthData?.access_token

    if (!accessToken) {
      throw new Error("No access token found")
    }

    // Add the Authorization header to the request
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    }

    // Make the request with the Authorization header
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Important: include cookies in the request
    })

    // Parse the response
    const data = await response.json()

    // Log response status and data for debugging
    console.log(`${options.method || "GET"} ${url} response status:`, response.status)
    console.log(`${options.method || "GET"} ${url} response data:`, data)

    // Return both the response and the parsed data
    return { response, data }
  } catch (error) {
    console.error("Error in authenticatedFetch:", error)
    throw error
  }
}
