import { AdminProtected } from "@/components/auth/admin-protected"
import { ForumTablesMigration } from "@/components/admin/forum-tables-migration"

export default function ForumTablesMigrationPage() {
  return (
    <AdminProtected>
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Forum Tables Migration</h1>
          <ForumTablesMigration />
        </div>
      </div>
    </AdminProtected>
  )
}
