import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Remove any automatically created "General Discussion" category
    const { error: deleteError } = await supabase.from("forum_categories").delete().eq("name", "General Discussion")

    if (deleteError) {
      console.error("Error removing General Discussion category:", deleteError)
    }

    // Update existing categories to ensure proper admin_only flags
    const { error: updateAnnouncementsError } = await supabase
      .from("forum_categories")
      .update({ admin_only: true })
      .or("name.ilike.%announcement%,name.ilike.%admin%")

    if (updateAnnouncementsError) {
      console.error("Error updating announcement categories:", updateAnnouncementsError)
    }

    // Update other categories to be non-admin
    const { error: updateOthersError } = await supabase
      .from("forum_categories")
      .update({ admin_only: false })
      .is("admin_only", null)
      .not("name", "ilike", "%announcement%")
      .not("name", "ilike", "%admin%")

    if (updateOthersError) {
      console.error("Error updating other categories:", updateOthersError)
    }

    return NextResponse.json({
      success: true,
      message: "Successfully cleaned up forum categories",
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
