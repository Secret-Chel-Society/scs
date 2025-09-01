import { PageHeader } from "@/components/ui/page-header"
import { PlayerLinkTester } from "@/components/admin/player-link-tester"

export default function PlayerLinkTestPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader heading="Player Link Tester" subheading="Test different column names for EA player mappings" />
      <PlayerLinkTester />
    </div>
  )
}
