import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { userId, source, adminKey } = await request.json()

    // Validate admin key
    if (adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 403 })
    }

    // Create Supabase admin client
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    if (source === "auth") {
      // Delete user from Auth
      const { error } = await supabase.auth.admin.deleteUser(userId)

      if (error) {
        throw new Error(`Failed to delete auth user: ${error.message}`)
      }
    } else if (source === "database") {
      // Delete user from database
      const { error } = await supabase.from("users").delete().eq("id", userId)

      if (error) {
        throw new Error(`Failed to delete database user: ${error.message}`)
      }
    } else if (source === "tokens") {
      // Delete verification tokens
      const { error } = await supabase.from("email_verification_tokens").delete().ilike("email", userId) // userId is actually the email in this case

      if (error) {
        throw new Error(`Failed to delete verification tokens: ${error.message}`)
      }
    } else {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 })
  }
}
