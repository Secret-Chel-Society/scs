import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get request body
    const { table, column } = await request.json()

    if (!table || !column) {
      return NextResponse.json({ error: "Table and column names are required" }, { status: 400 })
    }

    // Try a direct query to check if the column exists
    // This is the most reliable method that doesn't depend on special functions
    try {
      // We'll try to select the column directly from the table
      // If the column doesn't exist, this will throw an error
      const query = `SELECT "${column}" FROM "${table}" LIMIT 0;`
      const { error } = await supabase.rpc("exec_sql", { query })

      // If there's no error, the column exists
      if (!error) {
        return NextResponse.json({ exists: true })
      }

      // If the error message indicates the column doesn't exist
      if (
        error.message &&
        (error.message.includes(`column "${column}" does not exist`) ||
          error.message.includes(`column ${table}.${column} does not exist`))
      ) {
        return NextResponse.json({ exists: false })
      }

      // For other errors, we'll try a different approach
      console.log("First check method failed:", error)
    } catch (e) {
      console.log("Error in first check method:", e)
      // Continue to the next method
    }

    // Fallback method: Try to use the information_schema directly
    try {
      const { data, error } = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", table)
        .eq("column_name", column)
        .limit(1)

      if (error) {
        console.log("Information schema query failed:", error)
        // If this fails too, we'll assume the column doesn't exist
        return NextResponse.json({ exists: false })
      }

      return NextResponse.json({ exists: data && data.length > 0 })
    } catch (e) {
      console.log("Error in second check method:", e)
      // If all methods fail, assume the column doesn't exist
      return NextResponse.json({ exists: false })
    }
  } catch (error: any) {
    console.error("Error checking column existence:", error)
    // Return false rather than an error to avoid breaking the UI
    return NextResponse.json({ exists: false })
  }
}
