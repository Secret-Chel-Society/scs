// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createAdminClient()
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // Test 1: Check authentication
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      results.tests.authentication = {
        success: !authError && !!user,
        user: user ? { id: user.id, email: user.email } : null,
        error: authError?.message
      }
    } catch (error: any) {
      results.tests.authentication = { success: false, error: error.message }
    }

    // Test 2: Check admin role
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single()
        
        results.tests.admin_role = {
          success: !roleError && roleData?.role === "Admin",
          role: roleData?.role,
          error: roleError?.message
        }
      } else {
        results.tests.admin_role = { success: false, error: "No authenticated user" }
      }
    } catch (error: any) {
      results.tests.admin_role = { success: false, error: error.message }
    }

    // Test 3: Check system_settings access
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .limit(5)
      
      results.tests.system_settings = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      }
    } catch (error: any) {
      results.tests.system_settings = { success: false, error: error.message }
    }

    // Test 4: Check seasons access
    try {
      const { data, error } = await supabase
        .from("seasons")
        .select("id, name, is_active")
        .limit(5)
      
      results.tests.seasons = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      }
    } catch (error: any) {
      results.tests.seasons = { success: false, error: error.message }
    }

    // Test 5: Check ip_logs access
    try {
      const { data, error } = await supabase
        .from("ip_logs")
        .select("id, ip_address")
        .limit(5)
      
      results.tests.ip_logs = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      }
    } catch (error: any) {
      results.tests.ip_logs = { success: false, error: error.message }
    }

    // Test 6: Check users table IP columns
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, registration_ip, last_login_ip")
        .limit(5)
      
      results.tests.users_ip_columns = {
        success: !error,
        count: data?.length || 0,
        has_registration_ip: data?.some(u => u.registration_ip) || false,
        has_last_login_ip: data?.some(u => u.last_login_ip) || false,
        error: error?.message
      }
    } catch (error: any) {
      results.tests.users_ip_columns = { success: false, error: error.message }
    }

    // Test 7: Check bidding table access
    try {
      const { data, error } = await supabase
        .from("player_bidding")
        .select("id, bid_amount")
        .limit(5)
      
      results.tests.player_bidding = {
        success: !error,
        count: data?.length || 0,
        error: error?.message
      }
    } catch (error: any) {
      results.tests.player_bidding = { success: false, error: error.message }
    }

    // Test 8: Try to update system_settings
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: "diagnostic_test",
          value: "test_value",
          updated_at: new Date().toISOString()
        })
      
      results.tests.system_settings_update = {
        success: !error,
        error: error?.message
      }
    } catch (error: any) {
      results.tests.system_settings_update = { success: false, error: error.message }
    }

    // Test 9: Check RLS policies
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled
          FROM pg_tables 
          WHERE tablename IN ('system_settings', 'seasons', 'ip_logs', 'users', 'player_bidding')
          AND schemaname = 'public'
        `
      })
      
      results.tests.rls_status = {
        success: !error,
        tables: data,
        error: error?.message
      }
    } catch (error: any) {
      results.tests.rls_status = { success: false, error: error.message }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error("Diagnostic error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
