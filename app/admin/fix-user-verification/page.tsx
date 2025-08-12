import type { Metadata } from "next"
import FixUserVerificationMigration from "@/components/admin/fix-user-verification-migration"

export const metadata: Metadata = {
  title: "Fix User Verification Status",
  description: "Fix verification status for all users",
}

export default function FixUserVerificationPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Fix User Verification Status</h1>
      <div className="grid gap-6">
        <FixUserVerificationMigration />
      </div>
    </div>
  )
}
