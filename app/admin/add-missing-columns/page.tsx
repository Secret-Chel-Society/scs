import { AddMissingColumnsMigration } from "@/components/admin/add-missing-columns-migration"

export default function AddMissingColumnsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Add Missing EA Player Stats Columns</h1>
      <AddMissingColumnsMigration />
    </div>
  )
}
