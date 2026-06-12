/**
 * Client-side utility functions for making direct EA API requests
 * No proxy or ScraperAPI - direct browser calls to EA Sports NHL API
 */

/**
 * Fetches data directly from EA API on the client side
 * Includes retry logic for rate limiting (429) errors
 */
export async function fetchFromEADirect(url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  try {
    // Make direct request to EA API
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Accept: "application/json",
      },
      mode: "cors", // Enable CORS
    })

    if (response.status === 429 && retryCount < 3) {
      const retryDelay = Math.pow(2, retryCount) * 2000 // Exponential backoff: 2s, 4s, 8s
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return fetchFromEADirect(url, options, retryCount + 1)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`EA API error (${response.status}):`, errorText.substring(0, 200))
      throw new Error(`EA API request failed: ${response.status} ${response.statusText}`)
    }

    return response
  } catch (error: any) {
    console.error(`Error fetching from EA API:`, error)
    throw error
  }
}

/**
 * Fetches JSON data directly from EA API on the client side
 */
export async function fetchEAJsonDirect<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchFromEADirect(url, options)
  const data = await response.json()
  return data
}
