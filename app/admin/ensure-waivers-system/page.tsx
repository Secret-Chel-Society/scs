import { EnsureWaiversSystemMigration } from "@/components/admin/ensure-waivers-system-migration"

export default function EnsureWaiversSystemPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Ensure Waivers System</h1>
        <EnsureWaiversSystemMigration />
      </div>
    </div>
  )
}
