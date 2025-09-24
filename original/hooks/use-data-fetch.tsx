"use client"

/// Generic fetcher for any REST endpoint
const restFetcher = async <T = any>(url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`)
  }
  return (await res.json()) as T
}

// -----------------------------------------------------------------------------
// useDataFetch – simple REST hook (SWR)
// -----------------------------------------------------------------------------
import useSWR from "swr"
import { useState, useEffect } from "react"

/**
 * Generic data-fetching hook for REST endpoints.
 *
 * @param url  –  API route to fetch (pass `null` to pause fetching)
 * @param options – SWR configuration overrides (optional)
 */
export function useDataFetch<T = any>(url: string | null, options: Parameters<typeof useSWR>[2] = {}) {
  // Wait until we have a valid url before starting SWR
  const [readyUrl, setReadyUrl] = useState<string | null>(null)

  useEffect(() => {
    if (url) setReadyUrl(url)
  }, [url])

  const { data, error, mutate, isValidating } = useSWR<T>(readyUrl, restFetcher, {
    revalidateOnFocus: false,
    ...options,
  })

  return {
    data,
    error,
    isLoading: readyUrl !== null && !error && !data,
    mutate,
    isValidating,
  }
}
