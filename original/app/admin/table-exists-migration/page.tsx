import { TableExistsFunctionMigration } from "@/components/admin/table-exists-function-migration"

export default function TableExistsMigrationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Table Exists Function Migration</h1>
      <div className="space-y-6">
        <TableExistsFunctionMigration />
      </div>
    </div>
  )
}
