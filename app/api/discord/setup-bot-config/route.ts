import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Delete any existing config to ensure we have only one
    await supabase.from("discord_bot_config").delete().neq("id", "00000000-0000-0000-0000-000000000000")

    // Insert the correct configuration
    const { data, error } = await supabase.from("discord_bot_config").insert({
      guild_id: "1345946042281234442",
      bot_token: "MTQwMzUwNDI1MjUwODMwNzQ3Ng.GR4XzV.Y5knAT6iWSZNbLqysm3f9Kew6n3EjPW_ppnu6k",
      registered_role_id: "1376351990354804848",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error setting up bot config:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Bot configuration set up successfully",
      data,
    })
  } catch (error: any) {
    console.error("Error setting up bot config:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
