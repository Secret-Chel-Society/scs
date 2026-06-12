// lib/db/fetch-players-by-user-ids.ts
// Helper to call the RPC get_players_by_user_ids(uids uuid[])

export interface RpcPlayerRow {
  id: string
  user_id: string
  role: string
  salary: number
  is_tc: boolean | null
  team_id: string | null
  team_id_ahl: string | null
  team_id_ecl: string | null
  tc_team_id: string | null
  tc_team_id_ahl: string | null
  tc_team_id_ecl: string | null
  team_name: string | null
  ahl_team_name: string | null
  ecl_team_name: string | null
  tc_team_name: string | null
  tc_ahl_team_name: string | null
  tc_ecl_team_name: string | null
}

export async function fetchPlayersByUserIds(
  supabase: any,
  userIds: string[]
): Promise<RpcPlayerRow[]> {
  if (!userIds?.length) return []
  const { data, error } = await supabase.rpc("get_players_by_user_ids", { uids: userIds })
  if (error) throw error
  return data as RpcPlayerRow[]
}
