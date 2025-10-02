/**
 * Utility functions for making EA API requests through ScraperAPI
 */

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY

class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private activeRequests = 0
  private readonly maxConcurrent = 1 // ScraperAPI free plan typically allows 1 concurrent request
  private readonly delayBetweenRequests = 1000 // 1 second delay between requests

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.activeRequests++
    const fn = this.queue.shift()

    if (fn) {
      try {
        await fn()
      } finally {
        this.activeRequests--
        // Add delay before processing next request
        await new Promise((resolve) => setTimeout(resolve, this.delayBetweenRequests))
        this.processQueue()
      }
    }
  }
}

const requestQueue = new RequestQueue()

/**
 * Fetches data from EA API using ScraperAPI to bypass bot protection
 * Includes retry logic for rate limiting (429) errors
 */
export async function fetchFromEA(url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  if (!SCRAPER_API_KEY) {
    throw new Error("SCRAPER_API_KEY environment variable is not set")
  }

  return requestQueue.add(async () => {
    // Construct ScraperAPI URL
    const scraperApiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`

    console.log(`[v0] Fetching from EA API via ScraperAPI: ${url}`)

    // Make request through ScraperAPI
    const response = await fetch(scraperApiUrl, {
      ...options,
      headers: {
        ...options.headers,
        Accept: "application/json",
      },
    })

    console.log(`[v0] ScraperAPI response status: ${response.status}`)

    if (response.status === 429 && retryCount < 3) {
      const retryDelay = Math.pow(2, retryCount) * 2000 // Exponential backoff: 2s, 4s, 8s
      console.log(`[v0] Rate limited (429), retrying in ${retryDelay}ms (attempt ${retryCount + 1}/3)`)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return fetchFromEA(url, options, retryCount + 1)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] ScraperAPI error (${response.status}):`, errorText.substring(0, 200))
      throw new Error(`EA API request failed: ${response.status} ${response.statusText}`)
    }

    return response
  })
}

/**
 * Fetches JSON data from EA API using ScraperAPI
 */
export async function fetchEAJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchFromEA(url, options)
  const data = await response.json()
  console.log(`[v0] Successfully fetched JSON data from EA API`)
  return data
}
