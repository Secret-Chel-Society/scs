import { NextResponse } from "next/server"

export async function GET() {
  const adsContent = ""

  return new NextResponse(adsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  })
}
