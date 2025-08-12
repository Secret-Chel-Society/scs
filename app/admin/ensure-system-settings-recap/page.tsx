import { EnsureSystemSettingsRecapMigration } from "@/components/admin/ensure-system-settings-recap-migration"

export default function EnsureSystemSettingsRecapPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">System Settings Migration</h1>
        <EnsureSystemSettingsRecapMigration />
      </div>
    </div>
  )
}
