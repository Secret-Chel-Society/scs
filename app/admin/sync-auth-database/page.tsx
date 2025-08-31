import type { Metadata } from "next"
import AuthDatabaseSync from "@/components/admin/auth-database-sync"
import { Database, Sync } from "lucide-react"

export const metadata: Metadata = {
  title: "Auth to Database Sync - SCS Admin",
  description: "Sync users from Supabase Auth to database tables",
}

export default function SyncAuthDatabasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-400" />
            Auth to Database Sync
          </h1>
          <p className="text-white/70 text-lg">
            Sync users from Supabase Auth to your application database tables
          </p>
        </div>
        <AuthDatabaseSync />
      </div>
    </div>
  )
}
