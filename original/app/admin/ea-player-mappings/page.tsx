import { EaPlayerMappingsManager } from "@/components/admin/ea-player-mappings-manager"
import { PageHeader } from "@/components/ui/page-header"

export default function EaPlayerMappingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader heading="EA Player Mappings" subheading="Manage mappings between EA personas and MGHL players" />
      <EaPlayerMappingsManager />
    </div>
  )
}
