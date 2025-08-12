import { AddMissingEaColumnsMigration } from "@/components/admin/add-missing-ea-columns-migration"

export default function EaColumnsMigrationPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">EA Player Stats Columns Migration</h1>
      <p className="mb-6 text-muted-foreground">
        This page allows you to add missing columns to the EA player stats table that are needed for displaying complete
        player statistics from EA Sports NHL matches.
      </p>
      <AddMissingEaColumnsMigration />
    </div>
  )
}
