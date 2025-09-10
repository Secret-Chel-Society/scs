import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    console.log("🔍 Diagnosing waivers schema issues")

    // Test 1: Check if waivers table exists and its structure
    const { data: waiversTable, error: waiversTableError } = await supabase
      .from("information_schema.tables")
      .select("*")
      .eq("table_schema", "public")
      .eq("table_name", "waivers")

    console.log("Waivers table exists:", waiversTable?.length > 0)
    if (waiversTableError) {
      console.error("Error checking waivers table:", waiversTableError)
    }

    // Test 2: Check waivers table columns
    const { data: waiversColumns, error: waiversColumnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_schema", "public")
      .eq("table_name", "waivers")
      .order("ordinal_position")

    console.log("Waivers columns:", waiversColumns)
    if (waiversColumnsError) {
      console.error("Error checking waivers columns:", waiversColumnsError)
    }

    // Test 3: Check players table columns
    const { data: playersColumns, error: playersColumnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_schema", "public")
      .eq("table_name", "players")
      .order("ordinal_position")

    console.log("Players columns:", playersColumns)
    if (playersColumnsError) {
      console.error("Error checking players columns:", playersColumnsError)
    }

    // Test 4: Check users table columns
    const { data: usersColumns, error: usersColumnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_schema", "public")
      .eq("table_name", "users")
      .order("ordinal_position")

    console.log("Users columns:", usersColumns)
    if (usersColumnsError) {
      console.error("Error checking users columns:", usersColumnsError)
    }

    // Test 5: Check teams table columns
    const { data: teamsColumns, error: teamsColumnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_schema", "public")
      .eq("table_name", "teams")
      .order("ordinal_position")

    console.log("Teams columns:", teamsColumns)
    if (teamsColumnsError) {
      console.error("Error checking teams columns:", teamsColumnsError)
    }

    // Test 6: Check waiver_claims table
    const { data: waiverClaimsTable, error: waiverClaimsTableError } = await supabase
      .from("information_schema.tables")
      .select("*")
      .eq("table_schema", "public")
      .eq("table_name", "waiver_claims")

    console.log("Waiver claims table exists:", waiverClaimsTable?.length > 0)
    if (waiverClaimsTableError) {
      console.error("Error checking waiver_claims table:", waiverClaimsTableError)
    }

    // Test 7: Try a simple waivers query
    const { data: simpleWaivers, error: simpleWaiversError } = await supabase
      .from("waivers")
      .select("id, player_id, status, claim_deadline")
      .limit(5)

    console.log("Simple waivers query result:", { data: simpleWaivers, error: simpleWaiversError })

    // Test 8: Check foreign key constraints
    const { data: foreignKeys, error: foreignKeysError } = await supabase
      .from("information_schema.key_column_usage")
      .select("table_name, column_name, referenced_table_name, referenced_column_name")
      .eq("table_schema", "public")
      .in("table_name", ["waivers", "waiver_claims", "waiver_priority"])

    console.log("Foreign key constraints:", foreignKeys)
    if (foreignKeysError) {
      console.error("Error checking foreign keys:", foreignKeysError)
    }

    return NextResponse.json({
      success: true,
      diagnostics: {
        waiversTableExists: waiversTable?.length > 0,
        waiversColumns: waiversColumns,
        playersColumns: playersColumns,
        usersColumns: usersColumns,
        teamsColumns: teamsColumns,
        waiverClaimsTableExists: waiverClaimsTable?.length > 0,
        simpleWaiversQuery: {
          data: simpleWaivers,
          error: simpleWaiversError
        },
        foreignKeys: foreignKeys
      }
    })

  } catch (error: any) {
    console.error("❌ Error in waivers schema diagnosis:", error)
    return NextResponse.json({ 
      error: error.message || "An error occurred",
      stack: error.stack 
    }, { status: 500 })
  }
}
