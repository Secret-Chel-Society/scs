import { SyncMissingUsers } from "@/components/admin/sync-missing-users"

export default function SyncMissingUsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sync Missing Users</h1>
          <p className="text-muted-foreground">
            Find and sync users who exist in Supabase Auth but are missing from the users table.
          </p>
        </div>

        <SyncMissingUsers />
      </div>
    </div>
  )
}
