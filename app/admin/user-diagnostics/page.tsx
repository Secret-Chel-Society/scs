import type { Metadata } from "next"
import UserDiagnostics from "@/components/admin/user-diagnostics"

export const metadata: Metadata = {
  title: "User Diagnostics",
  description: "Diagnose and fix user account issues",
}

export default function UserDiagnosticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                User Diagnostics
              </h1>
              <p className="text-white/70 mt-2">Diagnose and fix user account issues</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="mb-6">
          <p className="text-white/70 text-lg">
            Use this tool to diagnose and fix issues with user accounts. You can look up users by email, check their
            verification status, and perform actions like sending verification emails or creating missing user records.
          </p>
        </div>

        <UserDiagnostics />
      </div>
    </div>
  )
}
