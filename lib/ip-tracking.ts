// Midnight Studios INTl - All rights reserved
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface IpTrackingData {
  ip: string
  userAgent: string
  action: 'register' | 'login' | 'logout'
  userId: string
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")
  const trueClientIp = request.headers.get("true-client-ip")
  const xClientIp = request.headers.get("x-client-ip")
  const remoteAddr = request.headers.get("remote-addr")

  // Parse x-forwarded-for to get the original client IP (first in the chain)
  let clientIp = "unknown"
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

  return clientIp
}

/**
 * Log IP address for a user action
 */
export async function logIpAddress(data: IpTrackingData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔍 Logging IP address:", {
      userId: data.userId,
      ip: data.ip,
      action: data.action,
      userAgent: data.userAgent.substring(0, 100) + "...", // Truncate for logging
    })

    // Use manual approach directly since it's more reliable
    console.log("🔄 Using direct IP logging approach...")
    
    // Insert into ip_logs table
    const { error: insertError } = await supabase
      .from("ip_logs")
      .insert({
        user_id: data.userId,
        ip_address: data.ip,
        action: data.action,
        user_agent: data.userAgent
      })

    if (insertError) {
      console.error("❌ Error inserting into ip_logs:", insertError)
      // Don't return error, continue with user update
    } else {
      console.log("✅ IP log entry created successfully")
    }

    // Update users table based on action
    const updateData: any = {}
    if (data.action === 'register') {
      updateData.registration_ip = data.ip
    } else if (data.action === 'login') {
      updateData.last_login_ip = data.ip
      updateData.last_login_at = new Date().toISOString()
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", data.userId)

      if (updateError) {
        console.error("❌ Error updating users table:", updateError)
        return { success: false, error: updateError.message }
      } else {
        console.log("✅ User IP data updated successfully")
      }
    }

    console.log("✅ IP address logged successfully")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Exception logging IP address:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Log IP address from a Next.js request
 */
export async function logIpFromRequest(
  request: Request, 
  userId: string, 
  action: 'register' | 'login' | 'logout'
): Promise<{ success: boolean; error?: string }> {
  const ip = getClientIp(request)
  const userAgent = request.headers.get("user-agent") || "unknown"

  return await logIpAddress({
    ip,
    userAgent,
    action,
    userId
  })
}

/**
 * Get IP tracking data for a user
 */
export async function getUserIpData(userId: string) {
  try {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("registration_ip, last_login_ip, last_login_at")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user IP data:", userError)
      return null
    }

    const { data: ipLogs, error: logsError } = await supabase
      .from("ip_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (logsError) {
      console.error("Error fetching IP logs:", logsError)
      return { user: userData, logs: [] }
    }

    return { user: userData, logs: ipLogs || [] }
  } catch (error: any) {
    console.error("Exception fetching user IP data:", error)
    return null
  }
}

/**
 * Check if IP tracking is properly set up
 */
export async function checkIpTrackingSetup(): Promise<{ isSetup: boolean; errors: string[] }> {
  const errors: string[] = []

  try {
    // Check if users table has IP columns
    const { data: userColumns, error: userError } = await supabase
      .from("users")
      .select("registration_ip, last_login_ip, last_login_at")
      .limit(1)

    if (userError) {
      errors.push(`Users table IP columns: ${userError.message}`)
    }

    // Check if ip_logs table exists
    const { data: ipLogs, error: logsError } = await supabase
      .from("ip_logs")
      .select("id")
      .limit(1)

    if (logsError) {
      errors.push(`IP logs table: ${logsError.message}`)
    }

    // Check if log_ip_address function exists
    const { data: functionTest, error: functionError } = await supabase.rpc('log_ip_address', {
      p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_ip_address: '127.0.0.1',
      p_action: 'test',
      p_user_agent: 'test'
    })

    if (functionError && !functionError.message.includes('violates foreign key constraint')) {
      errors.push(`log_ip_address function: ${functionError.message}`)
    }

    return {
      isSetup: errors.length === 0,
      errors
    }
  } catch (error: any) {
    errors.push(`Setup check exception: ${error.message}`)
    return { isSetup: false, errors }
  }
}
