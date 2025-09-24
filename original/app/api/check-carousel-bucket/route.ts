import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Add rate limiting protection
    try {
      // List all buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        // Check for rate limiting errors
        if (bucketsError.message.includes("Too Many") || bucketsError.message.includes("429")) {
          return NextResponse.json(
            {
              exists: false,
              error: "Rate limit exceeded. Please try again in a moment.",
              message: "Rate limit exceeded",
              isRateLimited: true,
            },
            { status: 429 },
          )
        }

        console.error("Error listing buckets:", bucketsError)
        return NextResponse.json(
          {
            exists: false,
            error: bucketsError.message,
            message: "Error listing buckets",
            buckets: [],
          },
          { status: 500 },
        )
      }

      // Check if carousel bucket exists
      const carouselBucket = buckets.find((bucket) => bucket.name.toLowerCase() === "carousel")

      return NextResponse.json({
        exists: !!carouselBucket,
        bucketNames: buckets.map((b) => b.name),
        message: carouselBucket ? "Carousel bucket found" : "Carousel bucket not found",
      })
    } catch (error: any) {
      // Handle specific errors
      if (error.message.includes("Too Many") || error.message.includes("429")) {
        return NextResponse.json(
          {
            exists: false,
            error: "Rate limit exceeded. Please try again in a moment.",
            message: "Rate limit exceeded",
            isRateLimited: true,
          },
          { status: 429 },
        )
      }

      throw error
    }
  } catch (error: any) {
    console.error("Unexpected error checking carousel bucket:", error)
    return NextResponse.json(
      {
        exists: false,
        error: error.message,
        message: "Unexpected error checking carousel bucket",
      },
      { status: 500 },
    )
  }
}
