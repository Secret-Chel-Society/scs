import { EaPlayerMappingsMigration } from "@/components/admin/ea-player-mappings-migration"
import { PageHeader } from "@/components/ui/page-header"

export default function EaPlayerMappingsMigrationPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="EA Player Mappings Migration"
        subheading="Create a table to map EA player personas to SCS player IDs"
      />
      <EaPlayerMappingsMigration />
    </div>
  )
}
