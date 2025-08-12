import { FixWaiverTablesMigration } from "@/components/admin/fix-waiver-tables-migration"

export default function FixWaiverTablesPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Fix Waiver Tables</h1>
      <div className="max-w-3xl mx-auto">
        <FixWaiverTablesMigration />
      </div>
    </div>
  )
}
