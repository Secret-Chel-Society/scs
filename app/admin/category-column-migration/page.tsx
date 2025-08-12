import { CategoryColumnMigration } from "@/components/admin/category-column-migration"

export default function CategoryColumnMigrationPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Add Category Column Migration</h1>
      <p className="mb-6 text-muted-foreground">
        This page allows you to add the 'category' column to the ea_player_stats table to fix issues with EA match data
        imports.
      </p>
      <div className="max-w-3xl mx-auto">
        <CategoryColumnMigration />
      </div>
    </div>
  )
}
