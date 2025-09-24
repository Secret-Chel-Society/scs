import { FixSeasonNumbersMigration } from "@/components/admin/fix-season-numbers-migration"

export default function FixSeasonNumbersPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Fix Season Numbers</h1>
      <FixSeasonNumbersMigration />
    </div>
  )
}
