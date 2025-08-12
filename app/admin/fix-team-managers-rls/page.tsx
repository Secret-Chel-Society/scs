import type { Metadata } from "next"
import FixTeamManagersRlsMigration from "@/components/admin/fix-team-managers-rls-migration"

export const metadata: Metadata = {
  title: "Fix Team Managers RLS | Admin",
  description: "Fix Row Level Security policies for team managers table",
}

export default function FixTeamManagersRlsPage() {
  return <FixTeamManagersRlsMigration />
}
