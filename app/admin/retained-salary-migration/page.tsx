import { RetainedSalaryMigration } from "@/components/admin/retained-salary-migration"

export default function RetainedSalaryMigrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Retained Salary Migration</h1>
          <p className="text-muted-foreground">Add database columns to support salary retention in trades.</p>
        </div>

        <RetainedSalaryMigration />
      </div>
    </div>
  )
}
