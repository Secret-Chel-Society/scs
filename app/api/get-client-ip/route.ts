import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get all possible IP-related headers
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")
  const trueClientIp = request.headers.get("true-client-ip")
  const xClientIp = request.headers.get("x-client-ip")
  const remoteAddr = request.headers.get("remote-addr")

  // Parse x-forwarded-for to get the original client IP (first in the chain)
  let clientIp = "0.0.0.0"
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs separated by commas
    // The first one is the original client IP
    clientIp = forwardedFor.split(",")[0].trim()
  } else if (trueClientIp) {
    clientIp = trueClientIp
  } else if (cfConnectingIp) {
    clientIp = cfConnectingIp
  } else if (realIp) {
    clientIp = realIp
  } else if (xClientIp) {
    clientIp = xClientIp
  } else if (remoteAddr) {
    clientIp = remoteAddr
  }

  // Get user agent
  const userAgent = request.headers.get("user-agent") || ""

  // Log all headers for debugging
  const allHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    allHeaders[key] = value
  })

  console.log("IP detection headers:", {
    forwardedFor,
    realIp,
    cfConnectingIp,
    trueClientIp,
    xClientIp,
    remoteAddr,
    detectedIp: clientIp,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({
    ip: clientIp,
    userAgent,
    headers: allHeaders,
    ipSources: {
      forwardedFor,
      realIp,
      cfConnectingIp,
      trueClientIp,
      xClientIp,
      remoteAddr,
    },
    detectionMethod: forwardedFor
      ? "x-forwarded-for"
      : trueClientIp
        ? "true-client-ip"
        : cfConnectingIp
          ? "cf-connecting-ip"
          : realIp
            ? "x-real-ip"
            : xClientIp
              ? "x-client-ip"
              : remoteAddr
                ? "remote-addr"
                : "fallback",
    timestamp: new Date().toISOString(),
  })
}
