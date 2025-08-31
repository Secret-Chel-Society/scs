import DiscordDebugPanel from "@/components/admin/discord-debug-panel"
import { MessageSquare, Bug } from "lucide-react"

export default function DiscordDebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-indigo-400" />
            Discord Debug Panel
          </h1>
          <p className="text-white/70 text-lg">
            Debug and troubleshoot Discord integration issues
          </p>
        </div>
        <DiscordDebugPanel />
      </div>
    </div>
  )
}
