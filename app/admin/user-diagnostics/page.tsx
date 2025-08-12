import type { Metadata } from "next"
import UserDiagnostics from "@/components/admin/user-diagnostics"

export const metadata: Metadata = {
  title: "User Diagnostics",
  description: "Diagnose and fix user account issues",
}

export default function UserDiagnosticsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">User Diagnostics</h1>
      <p className="text-muted-foreground mb-8">
        Use this tool to diagnose and fix issues with user accounts. You can look up users by email, check their
        verification status, and perform actions like sending verification emails or creating missing user records.
      </p>

      <UserDiagnostics />
    </div>
  )
}
