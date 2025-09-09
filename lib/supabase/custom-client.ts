import { createClient as createBrowserClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database"

// Create a singleton instance to avoid multiple instances
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createCustomClient() {
  if (supabaseClient) return supabaseClient

  supabaseClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
