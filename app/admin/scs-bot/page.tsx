import type { Metadata } from "next"
import SCSBotPanel from "@/components/admin/scs-bot-panel"

export const metadata: Metadata = {
  title: "SCS Bot Management | SCS Admin",
  description: "Manage Discord bot integration, role mapping, and Twitch streaming",
}

export default function SCSBotPage() {
  return <SCSBotPanel />
}
