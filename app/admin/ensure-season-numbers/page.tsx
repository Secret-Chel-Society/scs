import { EnsureSeasonNumbersMigration } from "@/components/admin/ensure-season-numbers-migration"

export default function EnsureSeasonNumbersPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Ensure Season Numbers</h1>
      <p className="mb-6 text-muted-foreground">
        This page allows you to run a migration that ensures all season numbers match their names.
      </p>
      <EnsureSeasonNumbersMigration />
    </div>
  )
}
