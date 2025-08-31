import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function sendNotification({
  userId,
  title,
  message,
  link,
}: {
  userId: string
  title: string
  message: string
  link?: string
}) {
  const supabase = createServerComponentClient({ cookies })

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    link,
  })

  return { success: !error, error }
}

export async function sendNotificationToTeam({
  teamId,
  title,
  message,
  link,
  excludeUserId,
}: {
  teamId: string
  title: string
  message: string
  link?: string
  excludeUserId?: string
}) {
  const supabase = createServerComponentClient({ cookies })

  // Get all players on the team
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("user_id")
    .eq("team_id", teamId)
    .neq("user_id", excludeUserId || "")

  if (playersError || !players) {
    return { success: false, error: playersError }
  }

  // Send notification to each player
  const notifications = players.map((player) => ({
    user_id: player.user_id,
    title,
    message,
    link,
  }))

  if (notifications.length === 0) {
    return { success: true }
  }

  const { error } = await supabase.from("notifications").insert(notifications)

  return { success: !error, error }
}
