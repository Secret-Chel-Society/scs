import SetupBotConfig from "@/components/admin/setup-bot-config"

export default function SetupBotConfigPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Setup Discord Bot Configuration</h1>
        <SetupBotConfig />
      </div>
    </div>
  )
}
