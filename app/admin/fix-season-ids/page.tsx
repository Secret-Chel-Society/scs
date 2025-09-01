import type { Metadata } from "next"
import FixNullSeasonIdsMigration from "@/components/admin/fix-null-season-ids-migration"

export const metadata: Metadata = {
  title: "Fix Null Season IDs | SCS Admin",
  description: "Fix registrations with null season IDs",
}

export default function FixSeasonIdsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Fix Null Season IDs</h1>
      <p className="mb-6 text-muted-foreground">
        This utility will fix registrations that have a null season_id but a valid season_number.
      </p>

      <div className="grid gap-6">
        <FixNullSeasonIdsMigration />
      </div>
    </div>
  )
}
