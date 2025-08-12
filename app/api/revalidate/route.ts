import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "Path parameter required" }, { status: 400 })
    }

    console.log("🔄 [Revalidate] Revalidating path:", path)
    revalidatePath(path)

    return NextResponse.json({
      success: true,
      message: `Revalidated ${path}`,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ [Revalidate] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
