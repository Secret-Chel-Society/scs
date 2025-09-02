import { EaStatsFieldsMigration } from "@/components/admin/ea-stats-fields-migration"

export default function EaStatsFieldsMigrationPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">EA Stats Fields Migration</h1>
      <p className="mb-6 text-muted-foreground">
        This page allows you to add all required EA stats fields to the database to ensure all player statistics are
        properly stored and displayed.
      </p>
      <div className="max-w-3xl mx-auto">
        <EaStatsFieldsMigration />
      </div>
    </div>
  )
}
