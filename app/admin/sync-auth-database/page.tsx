import type { Metadata } from "next"
import AuthDatabaseSync from "@/components/admin/auth-database-sync"

export const metadata: Metadata = {
  title: "Auth to Database Sync - MGHL Admin",
  description: "Sync users from Supabase Auth to database tables",
}

export default function SyncAuthDatabasePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Auth to Database Sync</h1>
        <p className="text-muted-foreground mt-2">Sync users from Supabase Auth to your application database tables</p>
      </div>
      <AuthDatabaseSync />
    </div>
  )
}
