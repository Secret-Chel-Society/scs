import type { Metadata } from "next"
import DebugAuthUsers from "@/components/admin/debug-auth-users"

export const metadata: Metadata = {
  title: "Debug Auth Users - MGHL Admin",
  description: "Debug and search for users in the Supabase Auth system",
}

export default function DebugAuthUsersPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Debug Auth Users</h1>
        <p className="text-muted-foreground mt-2">
          Debug and search for users in the Supabase Auth system to troubleshoot sync issues
        </p>
      </div>
      <DebugAuthUsers />
    </div>
  )
}
