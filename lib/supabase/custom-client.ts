import { createClient as createBrowserClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database"

// Create a singleton instance to avoid multiple instances
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createCustomClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured')
    // Return a mock client that will fail gracefully
    return null as any
  }

  supabaseClient = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: (...args) => fetch(...args),
      },
    },
  )

  return supabaseClient
}
