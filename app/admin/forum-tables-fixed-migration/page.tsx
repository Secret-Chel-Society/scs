import { ForumTablesFixedMigration } from "@/components/admin/forum-tables-fixed-migration"

export default function ForumTablesFixedMigrationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Forum Tables Fixed Migration</h1>
          <p className="text-gray-600">
            Run this migration to fix the forum tables with proper user relationships and correct categories.
          </p>
        </div>

        <ForumTablesFixedMigration />
      </div>
    </div>
  )
}
