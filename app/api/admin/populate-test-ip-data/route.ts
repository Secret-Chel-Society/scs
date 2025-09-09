// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createAdminClient()
    
    // Get some users to add test IP data to
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, gamer_tag_id")
      .limit(10)

    if (usersError) {
      throw usersError
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No users found to add test data to" 
      })
    }

    // Add test IP data for each user
    const testIps = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.1', '198.51.100.1']
    let updatedCount = 0

    for (const user of users) {
      const randomIp = testIps[Math.floor(Math.random() * testIps.length)]
      
      // Update user with test IP data
      const { error: updateError } = await supabase
        .from("users")
        .update({
          registration_ip: randomIp,
          last_login_ip: randomIp,
          last_login_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (!updateError) {
        // Add test IP log entries
        await supabase
          .from("ip_logs")
          .insert([
            {
              user_id: user.id,
              ip_address: randomIp,
              action: 'register',
              user_agent: 'Test User Agent',
              created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
            },
            {
              user_id: user.id,
              ip_address: randomIp,
              action: 'login',
              user_agent: 'Test User Agent',
              created_at: new Date().toISOString()
            }
          ])
        
        updatedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Added test IP data for ${updatedCount} users`,
      updatedCount
    })

  } catch (error: any) {
    console.error("Error populating test IP data:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to populate test IP data"
    }, { status: 500 })
  }
}