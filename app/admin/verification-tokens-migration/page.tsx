import { VerificationTokensTableMigration } from "@/components/admin/verification-tokens-table-migration"

export default function VerificationTokensMigrationPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Verification Tokens Migration</h1>
      <div className="space-y-8">
        <VerificationTokensTableMigration />
      </div>
    </div>
  )
}
