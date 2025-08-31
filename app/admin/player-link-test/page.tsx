import { PlayerLinkTester } from "@/components/admin/player-link-tester"
import { Link, TestTube } from "lucide-react"

export default function PlayerLinkTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Link className="h-8 w-8 text-blue-400" />
            Player Link Tester
          </h1>
          <p className="text-white/70 text-lg">
            Test different column names for EA player mappings
          </p>
        </div>
        <PlayerLinkTester />
      </div>
    </div>
  )
}
