import { EaPlayerMappingsFlexibleMigration } from "@/components/admin/ea-player-mappings-flexible-migration"
import { PageHeader } from "@/components/ui/page-header"

export default function EaPlayerMappingsFlexiblePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="EA Player Mappings Flexible Migration"
        subheading="Create a table to map EA player names to SCS player profiles with custom column names"
      />
      <EaPlayerMappingsFlexibleMigration />
    </div>
  )
}
