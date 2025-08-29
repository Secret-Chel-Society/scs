import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Update the bot configuration with the correct registered role ID
    const { error } = await supabase.from("discord_bot_config").upsert({
      guild_id: "1345946042281234442",
      bot_token: "MTM2NTg4ODY2MDE3MTY1MzE1MA.G9DxJ3.QzAkopXtoHjPTjMo7gf1-MYaOmmVbk5K2Ca3Wc",
      registered_role_id: "1376351990354804848",
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Bot configuration updated with correct registered role ID",
      registered_role_id: "1376351990354804848",
    })
  } catch (error: any) {
    console.error("Error updating bot config:", error)
    return NextResponse.json(
      {
        error: error.message,
        details: "Failed to update bot configuration",
      },
      { status: 500 },
    )
  }
}
