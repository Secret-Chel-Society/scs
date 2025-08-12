import { createClient } from "@/lib/supabase/server"

export async function updateEaPlayerStatsSeason(matchId: string, seasonId: number, cookieStore: string) {
  try {
    const supabase = createClient(cookieStore)

    // Update ea_player_stats for this match
    const { error } = await supabase.from("ea_player_stats").update({ season_id: seasonId }).eq("match_id", matchId)

    if (error) {
      console.error("Error updating ea_player_stats season_id:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateEaPlayerStatsSeason:", error)
    return { success: false, error: error.message }
  }
}
