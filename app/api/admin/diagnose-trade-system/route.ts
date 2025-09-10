import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    console.log("🔍 Diagnosing Trade System...")
    
    const supabase = createAdminClient()
    const diagnostics = {
      database: { status: "unknown", issues: [] },
      api: { status: "unknown", issues: [] },
      notifications: { status: "unknown", issues: [] },
      permissions: { status: "unknown", issues: [] },
      overall: "unknown"
    }

    // 1. Check database structure
    console.log("1️⃣ Checking database structure...")
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_name", "trades")
        .order("ordinal_position")

      if (tableError) {
        diagnostics.database.issues.push(`Error checking table structure: ${tableError.message}`)
        diagnostics.database.status = "error"
      } else if (!tableInfo || tableInfo.length === 0) {
        diagnostics.database.issues.push("Trades table does not exist")
        diagnostics.database.status = "error"
      } else {
        const requiredColumns = ["id", "team1_id", "team2_id", "team1_players", "team2_players", "status", "created_at"]
        const existingColumns = tableInfo.map(col => col.column_name)
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))
        
        if (missingColumns.length > 0) {
          diagnostics.database.issues.push(`Missing columns: ${missingColumns.join(", ")}`)
          diagnostics.database.status = "warning"
        } else {
          diagnostics.database.status = "ok"
        }
      }
    } catch (error) {
      diagnostics.database.issues.push(`Database check failed: ${error.message}`)
      diagnostics.database.status = "error"
    }

    // 2. Check API endpoints
    console.log("2️⃣ Checking API endpoints...")
    try {
      // Test if we can access the trades table
      const { data: trades, error: tradesError } = await supabase
        .from("trades")
        .select("id")
        .limit(1)

      if (tradesError) {
        diagnostics.api.issues.push(`Cannot access trades table: ${tradesError.message}`)
        diagnostics.api.status = "error"
      } else {
        diagnostics.api.status = "ok"
      }
    } catch (error) {
      diagnostics.api.issues.push(`API check failed: ${error.message}`)
      diagnostics.api.status = "error"
    }

    // 3. Check notifications system
    console.log("3️⃣ Checking notifications system...")
    try {
      const { data: notifications, error: notificationsError } = await supabase
        .from("notifications")
        .select("id")
        .limit(1)

      if (notificationsError) {
        diagnostics.notifications.issues.push(`Cannot access notifications table: ${notificationsError.message}`)
        diagnostics.notifications.status = "error"
      } else {
        diagnostics.notifications.status = "ok"
      }
    } catch (error) {
      diagnostics.notifications.issues.push(`Notifications check failed: ${error.message}`)
      diagnostics.notifications.status = "error"
    }

    // 4. Check permissions
    console.log("4️⃣ Checking permissions...")
    try {
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, role")
        .in("role", ["GM", "AGM", "Owner"])
        .limit(1)

      if (playersError) {
        diagnostics.permissions.issues.push(`Cannot access players table: ${playersError.message}`)
        diagnostics.permissions.status = "error"
      } else {
        diagnostics.permissions.status = "ok"
      }
    } catch (error) {
      diagnostics.permissions.issues.push(`Permissions check failed: ${error.message}`)
      diagnostics.permissions.status = "error"
    }

    // 5. Check for existing trades
    console.log("5️⃣ Checking existing trades...")
    try {
      const { data: existingTrades, error: tradesError } = await supabase
        .from("trades")
        .select("id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10)

      if (tradesError) {
        diagnostics.database.issues.push(`Cannot fetch existing trades: ${tradesError.message}`)
      } else {
        console.log(`Found ${existingTrades?.length || 0} existing trades`)
      }
    } catch (error) {
      console.error("Error checking existing trades:", error)
    }

    // Determine overall status
    const allStatuses = [
      diagnostics.database.status,
      diagnostics.api.status,
      diagnostics.notifications.status,
      diagnostics.permissions.status
    ]

    if (allStatuses.every(status => status === "ok")) {
      diagnostics.overall = "healthy"
    } else if (allStatuses.some(status => status === "error")) {
      diagnostics.overall = "critical"
    } else {
      diagnostics.overall = "warning"
    }

    console.log("✅ Trade system diagnosis completed")
    console.log("Overall status:", diagnostics.overall)

    return NextResponse.json({
      success: true,
      message: "Trade system diagnosis completed",
      diagnostics,
      recommendations: generateRecommendations(diagnostics)
    })

  } catch (error) {
    console.error("❌ Trade system diagnosis failed:", error)
    return NextResponse.json({
      success: false,
      error: "Diagnosis failed",
      message: error.message
    }, { status: 500 })
  }
}

function generateRecommendations(diagnostics: any) {
  const recommendations = []

  if (diagnostics.database.status === "error") {
    recommendations.push("Run the database migration: fix_trade_system.sql")
  }

  if (diagnostics.api.status === "error") {
    recommendations.push("Check API endpoint configurations and permissions")
  }

  if (diagnostics.notifications.status === "error") {
    recommendations.push("Verify notification system setup and permissions")
  }

  if (diagnostics.permissions.status === "error") {
    recommendations.push("Check user permissions and role assignments")
  }

  if (diagnostics.overall === "healthy") {
    recommendations.push("Trade system appears to be working correctly")
  }

  return recommendations
}
