import { VerificationTableDiagnostics } from "@/components/admin/verification-table-diagnostics"

export default function VerificationTableDiagnosticsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Verification Table Diagnostics</h1>
        <p className="text-gray-600 mt-2">
          Check the current schema of verification-related tables to understand the database structure.
        </p>
      </div>

      <VerificationTableDiagnostics />
    </div>
  )
}
