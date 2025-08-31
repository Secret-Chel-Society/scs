import type { Metadata } from "next"
import SCSBotPanel from "@/components/admin/scs-bot-panel"
import { Bot, MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "SCS Bot Management | SCS Admin",
  description: "Manage Discord bot integration, role mapping, and Twitch streaming",
}

export default function SCSBotPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Bot className="h-8 w-8 text-green-400" />
            SCS Bot Management
          </h1>
          <p className="text-white/70 text-lg">
            Manage Discord bot integration, role mapping, and Twitch streaming
          </p>
        </div>
        <SCSBotPanel />
      </div>
    </div>
  )
}
