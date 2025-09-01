import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get all possible IP-related headers
  const headers: Record<string, string | null> = {}

  // Common IP-related headers
  const ipHeaders = [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
    "true-client-ip",
    "x-client-ip",
    "forwarded",
    "x-forwarded",
    "remote-addr",
    "x-cluster-client-ip",
    "x-forwarded-host",
  ]

  // Get all IP-related headers
  ipHeaders.forEach((header) => {
    headers[header] = request.headers.get(header)
  })

  // Get all headers for debugging
  const allHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    allHeaders[key] = value
  })

  // Determine the best IP to use
  let detectedIp = "0.0.0.0"
  if (headers["x-forwarded-for"]) {
    detectedIp = headers["x-forwarded-for"].split(",")[0].trim()
  } else if (headers["true-client-ip"]) {
    detectedIp = headers["true-client-ip"]
  } else if (headers["cf-connecting-ip"]) {
    detectedIp = headers["cf-connecting-ip"]
  } else if (headers["x-real-ip"]) {
    detectedIp = headers["x-real-ip"]
  } else if (headers["x-client-ip"]) {
    detectedIp = headers["x-client-ip"]
  }

  return NextResponse.json({
    ipHeaders: headers,
    allHeaders: allHeaders,
    detectedIp: detectedIp,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get("user-agent"),
    host: request.headers.get("host"),
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
  })
}
