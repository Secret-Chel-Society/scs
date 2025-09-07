import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { TeamBids } from "@/components/management/team-bids"

export default async function ManagementBidsPage() {
  const supabase = createServerComponentClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Get user's team
  const { data: player } = await supabase
    .from("players")
    .select("team_id, role")
    .eq("user_id", session.user.id)
    .single()

  // If user is not on a team or not a manager, redirect to home
  if (!player?.team_id || !["Owner", "GM", "AGM"].includes(player?.role || "")) {
    redirect("/")
  }

  return (
    <div className="container py-6">
      <PageHeader heading="Team Bids" text="Manage your team's active bids on free agents" />

      <div className="mt-6">
        <TeamBids teamId={player.team_id} />
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="text-lg font-medium mb-2">Bidding Rules</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>Bids last for 5 minutes (300 seconds)</li>
          <li>New bids must be at least $2,000,000 higher than the current highest bid</li>
          <li>You can extend your own bid to reset the 5-minute timer</li>
          <li>When a bid expires with no higher bids, the player is automatically assigned to your team</li>
          <li>Your team's total salary cannot exceed the $65M salary cap</li>
        </ul>
      </div>
    </div>
  )
}
