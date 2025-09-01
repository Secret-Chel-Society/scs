import { EnsureEaPlayerStatsFieldsMigration } from "@/components/admin/ensure-ea-player-stats-fields-migration"

export default function EnsureEaPlayerStatsFieldsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Ensure EA Player Stats Fields</h1>
      <p className="mb-6 text-muted-foreground">
        This page allows you to ensure all necessary EA player stats fields exist in the database to properly store and
        display player statistics from EA Sports NHL.
      </p>
      <div className="max-w-3xl mx-auto">
        <EnsureEaPlayerStatsFieldsMigration />
      </div>
    </div>
  )
}
