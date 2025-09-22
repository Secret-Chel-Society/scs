import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"
    const redirectUrl = `${siteUrl}/reset-password`
    
    return NextResponse.json({
      success: true,
      environment: {
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "NOT SET",
        NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || "NOT SET",
        finalSiteUrl: siteUrl
      },
      redirectUrl,
      message: "This is the URL that should be used for password reset redirects"
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error
      },
      { status: 500 },
    )
  }
}
