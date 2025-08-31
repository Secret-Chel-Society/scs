"use client"

import { DebugUserSession } from "@/components/admin/debug-user-session"
import { Database, User } from "lucide-react"

export default function DebugUserSessionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-400" />
            Debug User Session
          </h1>
          <p className="text-white/70 text-lg">
            Debug and troubleshoot user session issues
          </p>
        </div>
        <DebugUserSession />
      </div>
    </div>
  )
}
