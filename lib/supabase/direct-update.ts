import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key for direct updates
export async function directUpdateMatch(matchId: string, updateData: any) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await supabase.from("matches").update(updateData).eq("id", matchId).select()

  if (error) {
    throw new Error(`Failed to update match: ${error.message}`)
  }

  return data
}
