import { OrphanedUserFinder } from "@/components/admin/orphaned-user-finder"

export default function OrphanedUsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orphaned User Management</h1>
        <p className="text-muted-foreground">
          Find and fix users that exist in Supabase Auth but not in your database, or vice versa
        </p>
      </div>

      <OrphanedUserFinder />
    </div>
  )
}
