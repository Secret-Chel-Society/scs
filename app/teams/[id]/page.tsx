import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { buildMetadata } from "@/lib/metadata"
import TeamDetailClient from "./team-detail-client"

export const dynamic = "force-dynamic"

async function getTeam(id: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await supabase
      .from("teams")
      .select("name, logo_url, wins, losses, otl, points, Division, Conference")
      .eq("id", id)
      .single()
    return data
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const team = await getTeam(id)

  if (!team) {
    return buildMetadata({
      title: "Team",
      description: "View team rosters, stats, and schedule in the MGHL.",
      path: `/teams/${id}`,
    })
  }

  const record = `${team.wins ?? 0}-${team.losses ?? 0}-${team.otl ?? 0}`
  const descParts = [`Record: ${record}`, `${team.points ?? 0} pts`]
  if (team.Division) descParts.push(`${team.Division} Division`)

  return buildMetadata({
    title: team.name,
    description: `${descParts.join(" • ")}. View ${team.name}'s roster, stats, and schedule in the MGHL.`,
    image: team.logo_url || undefined,
    path: `/teams/${id}`,
    type: "profile",
  })
}

export default function TeamDetailPage() {
  return <TeamDetailClient />
}
