import { FixExistingBidsMigration } from "@/components/admin/fix-existing-bids-migration"

export default function FixExistingBidsMigrationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Fix Existing Bids Migration</h1>
        <p className="text-muted-foreground mt-2">Fix finalization status and won_bid logic for all existing bids</p>
      </div>
      <FixExistingBidsMigration />
    </div>
  )
}
