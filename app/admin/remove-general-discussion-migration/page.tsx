import { RemoveGeneralDiscussionMigration } from "@/components/admin/remove-general-discussion-migration"

export default function RemoveGeneralDiscussionMigrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Forum Categories Cleanup</h1>
        <RemoveGeneralDiscussionMigration />
      </div>
    </div>
  )
}
