import { TokenSystemMigration } from "@/components/admin/token-system-migration"

export default function TokenSystemMigrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Token System Migration</h1>
        <TokenSystemMigration />
      </div>
    </div>
  )
}
