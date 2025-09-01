import DiscordSyncFailuresMigration from "@/components/admin/discord-sync-failures-migration"

export default function DiscordSyncFailuresMigrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Discord Sync Failures Migration</h1>
        <DiscordSyncFailuresMigration />
      </div>
    </div>
  )
}
