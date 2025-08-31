import { BiddingRecap } from "@/components/admin/bidding-recap"
import { Gavel, DollarSign } from "lucide-react"

export default function BiddingRecapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Gavel className="h-8 w-8 text-green-400" />
            Bidding Recap Management
          </h1>
          <p className="text-white/70 text-lg">
            Manage and generate bidding recaps for player auctions
          </p>
        </div>

        <BiddingRecap />
      </div>
    </div>
  )
}
