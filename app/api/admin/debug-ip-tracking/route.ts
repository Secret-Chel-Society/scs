// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    
    console.log("🔍 Debugging IP tracking system...")

    // Check if IP tracking tables and functions exist
    const checks = {
      usersTableColumns: false,
      ipLogsTable: false,
      logIpAddressFunction: false,
      sampleData: null
    }

    // 1. Check if users table has IP columns
    try {
      const { data: userColumns, error: userError } = await supabase
        .from("users")
        .select("registration_ip, last_login_ip, last_login_at")
        .limit(1)

      if (!userError) {
        checks.usersTableColumns = true
        console.log("✅ Users table has IP columns")
      } else {
        console.log("❌ Users table missing IP columns:", userError.message)
      }
    } catch (error: any) {
      console.log("❌ Error checking users table:", error.message)
    }

    // 2. Check if ip_logs table exists
    try {
      const { data: ipLogs, error: logsError } = await supabase
        .from("ip_logs")
        .select("id")
        .limit(1)

      if (!logsError) {
        checks.ipLogsTable = true
        console.log("✅ ip_logs table exists")
      } else {
        console.log("❌ ip_logs table missing:", logsError.message)
      }
    } catch (error: any) {
      console.log("❌ Error checking ip_logs table:", error.message)
    }

    // 3. Check if log_ip_address function exists
    try {
      const { data: functionTest, error: functionError } = await supabase.rpc('log_ip_address', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        p_ip_address: '127.0.0.1',
        p_action: 'test',
        p_user_agent: 'test'
      })

      if (!functionError || functionError.message.includes('violates foreign key constraint')) {
        checks.logIpAddressFunction = true
        console.log("✅ log_ip_address function exists")
      } else {
        console.log("❌ log_ip_address function missing:", functionError.message)
      }
    } catch (error: any) {
      console.log("❌ Error checking log_ip_address function:", error.message)
    }

    // 4. Get sample user data to see current state
    try {
      const { data: sampleUsers, error: sampleError } = await supabase
        .from("users")
        .select("id, email, gamer_tag_id, registration_ip, last_login_ip, last_login_at")
        .limit(5)

      if (!sampleError && sampleUsers) {
        checks.sampleData = sampleUsers
        console.log("📊 Sample user data:", sampleUsers)
      }
    } catch (error: any) {
      console.log("❌ Error getting sample data:", error.message)
    }

    // 5. Check if we need to run the migration
    const needsMigration = !checks.usersTableColumns || !checks.ipLogsTable || !checks.logIpAddressFunction

    return NextResponse.json({
      success: true,
      message: "IP tracking debug completed",
      checks,
      needsMigration,
      recommendations: needsMigration ? [
        "Run IP tracking migration to set up database tables and functions",
        "The migration will create the necessary columns and tables",
        "After migration, IP tracking should work properly"
      ] : [
        "Database setup looks correct",
        "Check if IP tracking is being called during login/registration",
        "Verify that the logIpFromRequest function is being used"
      ]
    })

  } catch (error: any) {
    console.error("❌ Error debugging IP tracking:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
