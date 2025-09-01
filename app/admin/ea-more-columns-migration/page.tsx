import { PageHeader } from "@/components/ui/page-header"
import { AddMoreEaColumnsMigration } from "@/components/admin/add-more-ea-columns-migration"

export default function EaMoreColumnsMigrationPage() {
  return (
    <div className="container py-6">
      <PageHeader
        heading="Add More EA Player Stats Columns"
        text="Add additional columns to the ea_player_stats table to support more EA Sports NHL statistics"
      />
      <div className="mt-6">
        <AddMoreEaColumnsMigration />
      </div>
    </div>
  )
}
