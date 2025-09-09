// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createAdminClient()
    
    // Get all users without IP data
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, gamer_tag_id, registration_ip, last_login_ip")
      .or("registration_ip.is.null,last_login_ip.is.null")

    if (usersError) {
      throw usersError
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All users already have IP data",
        updatedCount: 0
      })
    }

    // Get IP logs for these users
    const userIds = users.map(u => u.id)
    const { data: ipLogs, error: logsError } = await supabase
      .from("ip_logs")
      .select("user_id, ip_address, action, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false })

    if (logsError) {
      throw logsError
    }

    // Group logs by user
    const userLogs = new Map()
    ipLogs?.forEach(log => {
      if (!userLogs.has(log.user_id)) {
        userLogs.set(log.user_id, [])
      }
      userLogs.get(log.user_id).push(log)
    })

    let updatedCount = 0

    // Update users with their IP data
    for (const user of users) {
      const logs = userLogs.get(user.id) || []
      
      if (logs.length === 0) continue

      // Find registration and login IPs
      const registrationLog = logs.find(log => log.action === 'register')
      const loginLog = logs.find(log => log.action === 'login')

      const updateData: any = {}
      
      if (registrationLog && !user.registration_ip) {
        updateData.registration_ip = registrationLog.ip_address
      }
      
      if (loginLog && !user.last_login_ip) {
        updateData.last_login_ip = loginLog.ip_address
        updateData.last_login_at = loginLog.created_at
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", user.id)

        if (!updateError) {
          updatedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated IP data for ${updatedCount} users`,
      updatedCount
    })

  } catch (error: any) {
    console.error("Error updating IP data:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to update IP data"
    }, { status: 500 })
  }
}