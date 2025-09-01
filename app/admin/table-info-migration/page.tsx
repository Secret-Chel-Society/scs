import { TableInfoFunctionsMigration } from "@/components/admin/table-info-functions-migration"
import { PageHeader } from "@/components/ui/page-header"

export default function TableInfoMigrationPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Database Information Functions Migration"
        subheading="Create functions to explore database structure"
      />
      <TableInfoFunctionsMigration />
    </div>
  )
}
