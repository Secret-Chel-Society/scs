import { PageHeader } from "@/components/ui/page-header"
import { DatabaseStructureExplorer } from "@/components/admin/database-structure-explorer"

export default function DatabaseStructurePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Database Structure Explorer"
        subheading="Explore table structures and column names in the database"
      />
      <DatabaseStructureExplorer />
    </div>
  )
}
