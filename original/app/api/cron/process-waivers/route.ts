import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the waiver processing endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/waivers/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to process waivers")
    }

    return NextResponse.json({
      success: true,
      message: "Waiver processing completed",
      ...result,
    })
  } catch (error: any) {
    console.error("Cron waiver processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
