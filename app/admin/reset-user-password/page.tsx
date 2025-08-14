import type { Metadata } from "next"
import PasswordResetForm from "@/components/admin/password-reset-form"

export const metadata: Metadata = {
  title: "Reset User Password | MGHL Admin",
  description: "Reset a user's password by email address",
}

export default function ResetUserPasswordPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Reset User Password</h1>
      <p className="text-muted-foreground mb-8">
        Use this form to reset a user's password. The user will be able to log in with the new password immediately.
      </p>
      <PasswordResetForm />
    </div>
  )
}
