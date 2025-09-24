import type React from "react"
import { Suspense } from "react"
import { AdminProtected } from "@/components/auth/admin-protected"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminProtected>{children}</AdminProtected>
    </Suspense>
  )
}
