import SetupBotConfig from "@/components/admin/setup-bot-config"
import { Bot, Settings } from "lucide-react"

export default function SetupBotConfigPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Bot className="h-8 w-8 text-green-400" />
            Setup Discord Bot Configuration
          </h1>
          <p className="text-white/70 text-lg">
            Configure Discord bot settings and integration parameters
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <SetupBotConfig />
        </div>
      </div>
    </div>
  )
}
