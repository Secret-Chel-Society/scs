import { EaMatchDataMigration } from "@/components/admin/ea-match-data-migration"

export default function EaMatchDataMigrationPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">EA Match Data Migration</h1>
      <p className="text-muted-foreground mb-8">
        This page allows administrators to add the required EA match data column to the database.
      </p>
      <EaMatchDataMigration />
    </div>
  )
}
