import type { Metadata } from "next"
import MGHLBotPanel from "@/components/admin/mghl-bot-panel"

export const metadata: Metadata = {
  title: "MGHL Bot Management | MGHL Admin",
  description: "Manage Discord bot integration, role mapping, and Twitch streaming",
}

export default function MGHLBotPage() {
  return <MGHLBotPanel />
}
