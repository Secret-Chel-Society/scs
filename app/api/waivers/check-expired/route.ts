import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/types/database"

export async function POST() {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      },
    },
  )

  try {
    // Get all active waivers that have expired
    const now = new Date().toISOString()

    const { data: expiredWaivers, error: waiversError } = await supabase
      .from("waivers")
      .select("id, claim_deadline")
      .eq("status", "active")
      .lt("claim_deadline", now)

    if (waiversError) {
      throw waiversError
    }

    console.log(`Found ${expiredWaivers?.length || 0} expired waivers`)

    if (!expiredWaivers || expiredWaivers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired waivers found",
        expiredCount: 0,
      })
    }

    // Mark these as processing immediately to prevent them from showing in the UI
    const expiredIds = expiredWaivers.map((w) => w.id)
    await supabase.from("waivers").update({ status: "processing" }).in("id", expiredIds)

    // Call the waiver processing endpoint
    const processResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/waivers/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const processResult = await processResponse.json()

    if (!processResponse.ok) {
      throw new Error(processResult.error || "Failed to process expired waivers")
    }

    return NextResponse.json({
      success: true,
      message: `Found and processed ${expiredWaivers.length} expired waivers`,
      expiredCount: expiredWaivers.length,
      processResult,
    })
  } catch (error: any) {
    console.error("Error checking expired waivers:", error)
    return NextResponse.json({ 
      success: false,
      error: error.message || "An error occurred",
      details: error.details || "No additional details"
    }, { status: 500 })
  }
}
