import type { Metadata } from "next"
import PasswordResetForm from "@/components/admin/password-reset-form"
import { Lock, Key } from "lucide-react"

export const metadata: Metadata = {
  title: "Reset User Password | SCS Admin",
  description: "Reset a user's password by email address",
}

export default function ResetUserPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Lock className="h-8 w-8 text-red-400" />
            Reset User Password
          </h1>
          <p className="text-white/70 text-lg">
            Use this form to reset a user's password. The user will be able to log in with the new password immediately.
          </p>
        </div>
        <PasswordResetForm />
      </div>
    </div>
  )
}
