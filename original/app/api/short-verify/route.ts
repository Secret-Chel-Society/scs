import { NextResponse } from "next/server"
import crypto from "crypto"

// Store for temporary verification tokens
// In production, this should be in a database or Redis
const verificationTokens: Record<string, { email: string; expires: number }> = {}

// Clean up expired tokens periodically
setInterval(
  () => {
    const now = Date.now()
    Object.keys(verificationTokens).forEach((token) => {
      if (verificationTokens[token].expires < now) {
        delete verificationTokens[token]
      }
    })
  },
  60 * 60 * 1000,
) // Clean up every hour

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Generate a short token
    const token = crypto.randomBytes(6).toString("hex")

    // Store the token with a 24-hour expiration
    verificationTokens[token] = {
      email,
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    }

    // Generate the short verification URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"
    const verificationUrl = `${baseUrl}/v/${token}`

    return NextResponse.json({
      token,
      url: verificationUrl,
    })
  } catch (error: any) {
    console.error("Error generating short verification link:", error)
    return NextResponse.json({ error: "Failed to generate verification link" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const tokenData = verificationTokens[token]
    if (!tokenData) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // Token is valid, return the email
    return NextResponse.json({
      email: tokenData.email,
      valid: true,
    })
  } catch (error: any) {
    console.error("Error validating token:", error)
    return NextResponse.json({ error: "Failed to validate token" }, { status: 500 })
  }
}
