import { AutoUserCreationMigration } from "@/components/admin/auto-user-creation-migration"

export default function AutoUserCreationMigrationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auto User Creation Migration</h1>
        <AutoUserCreationMigration />
      </div>
    </div>
  )
}
