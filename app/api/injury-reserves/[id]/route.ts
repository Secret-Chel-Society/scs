import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "IR ID is required" }, { status: 400 })
    }

    // Update the status to cancelled instead of deleting
    const { data, error } = await supabase
      .from("injury_reserves")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error cancelling IR request:", error)
      return NextResponse.json({ error: "Failed to cancel IR request" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      injuryReserve: data,
    })
  } catch (error: any) {
    console.error("Error in injury reserves DELETE API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient()
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "IR ID is required" }, { status: 400 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { status, reason } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (reason !== undefined) updateData.reason = reason

    const { data, error } = await supabase.from("injury_reserves").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating IR request:", error)
      return NextResponse.json({ error: "Failed to update IR request" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      injuryReserve: data,
    })
  } catch (error: any) {
    console.error("Error in injury reserves PATCH API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
