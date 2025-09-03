import { PublicBiddingRecap } from "@/components/free-agency/public-bidding-recap"

export default function BiddingRecapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      <div className="container mx-auto py-8">
        <PublicBiddingRecap />
      </div>
    </div>
  )
}
