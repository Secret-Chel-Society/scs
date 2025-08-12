import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the table name from the request
    const { tableName } = await request.json()

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    // Try to check if the table exists using a direct query
    try {
      // Try to select a single row from the table
      const { data, error } = await supabase.from(tableName).select("*").limit(1)

      // If there's no error, the table exists
      return NextResponse.json({ exists: !error })
    } catch (directError) {
      console.error("Direct table check failed:", directError)

      // Try using the information_schema as a fallback
      try {
        const { data, error } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public")
          .eq("table_name", tableName)
          .single()

        return NextResponse.json({ exists: !error && !!data })
      } catch (schemaError) {
        console.error("Schema check failed:", schemaError)

        // If both methods fail, assume the table doesn't exist
        return NextResponse.json({ exists: false })
      }
    }
  } catch (error) {
    console.error("Error checking if table exists:", error)
    return NextResponse.json({ error: "Failed to check if table exists" }, { status: 500 })
  }
}
