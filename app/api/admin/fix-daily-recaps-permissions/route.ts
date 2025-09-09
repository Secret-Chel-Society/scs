// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log("🔧 Starting daily_recaps permissions fix...")

    // First, let's try to test the current permissions
    const testInsert = await supabase
      .from("daily_recaps")
      .insert({
        date: "1900-01-01",
        recap_data: { test: true, team_recaps: [] }
      })

    if (testInsert.error) {
      console.log("❌ Current permissions issue:", testInsert.error.message)
      
      // Try to fix permissions using SQL
      const fixPermissionsSQL = `
        -- Grant usage on the sequence to all necessary roles
        GRANT USAGE ON SEQUENCE daily_recaps_id_seq TO authenticated;
        GRANT USAGE ON SEQUENCE daily_recaps_id_seq TO service_role;
        GRANT USAGE ON SEQUENCE daily_recaps_id_seq TO anon;

        -- Grant table permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE daily_recaps TO authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE daily_recaps TO service_role;
        GRANT SELECT ON TABLE daily_recaps TO anon;
      `

      try {
        const { error: sqlError } = await supabase.rpc("run_sql", {
          query: fixPermissionsSQL
        })

        if (sqlError) {
          console.error("❌ SQL fix failed:", sqlError)
          return NextResponse.json({
            success: false,
            error: "Failed to fix permissions via SQL",
            details: sqlError.message,
            manualFix: "Please run the SQL commands manually in your database console"
          }, { status: 500 })
        }

        console.log("✅ Permissions fixed via SQL")
      } catch (sqlError) {
        console.error("❌ SQL execution failed:", sqlError)
        return NextResponse.json({
          success: false,
          error: "SQL execution failed",
          details: sqlError.message,
          manualFix: "Please run the fix_daily_recaps_comprehensive.sql file manually"
        }, { status: 500 })
      }
    } else {
      console.log("✅ Permissions are already correct")
      // Clean up test record
      await supabase.from("daily_recaps").delete().eq("date", "1900-01-01")
    }

    // Test the fix by trying to insert and delete a test record
    const testDate = "1900-01-02"
    const testData = {
      date: testDate,
      recap_data: {
        test: true,
        team_recaps: [],
        time_window_hours: 24,
        total_matches: 0
      }
    }

    const { data: insertData, error: insertError } = await supabase
      .from("daily_recaps")
      .insert(testData)
      .select()

    if (insertError) {
      console.error("❌ Insert test failed:", insertError)
      return NextResponse.json({
        success: false,
        error: "Insert test failed after permission fix",
        details: insertError.message
      }, { status: 500 })
    }

    console.log("✅ Insert test successful")

    // Clean up test record
    const { error: deleteError } = await supabase
      .from("daily_recaps")
      .delete()
      .eq("date", testDate)

    if (deleteError) {
      console.warn("⚠️ Delete test failed:", deleteError.message)
    } else {
      console.log("✅ Delete test successful")
    }

    return NextResponse.json({
      success: true,
      message: "Daily recaps permissions fixed successfully",
      testResults: {
        insert: "success",
        delete: deleteError ? "warning" : "success"
      }
    })

  } catch (error: any) {
    console.error("❌ Error fixing daily_recaps permissions:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Failed to fix daily_recaps permissions"
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log("🔍 Checking daily_recaps permissions...")

    // Test current permissions
    const testDate = "1900-01-03"
    const testData = {
      date: testDate,
      recap_data: {
        test: true,
        team_recaps: [],
        time_window_hours: 24,
        total_matches: 0
      }
    }

    const { data: insertData, error: insertError } = await supabase
      .from("daily_recaps")
      .insert(testData)
      .select()

    if (insertError) {
      console.log("❌ Permission check failed:", insertError.message)
      return NextResponse.json({
        success: false,
        hasPermissions: false,
        error: insertError.message,
        needsFix: true
      })
    }

    // Clean up test record
    await supabase.from("daily_recaps").delete().eq("date", testDate)

    console.log("✅ Permissions check passed")
    return NextResponse.json({
      success: true,
      hasPermissions: true,
      message: "Daily recaps permissions are working correctly"
    })

  } catch (error: any) {
    console.error("❌ Error checking daily_recaps permissions:", error)
    return NextResponse.json({
      success: false,
      hasPermissions: false,
      error: error.message,
      needsFix: true
    }, { status: 500 })
  }
}
