import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if verification_tokens table exists and get its schema
    const { data: verificationTokensSchema, error: vtError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'verification_tokens' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `,
    })

    // Check if email_verification_tokens table exists and get its schema
    const { data: emailVerificationTokensSchema, error: evtError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'email_verification_tokens' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `,
    })

    // Check what tables exist that contain 'verification' or 'token'
    const { data: relatedTables, error: rtError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '%verification%' OR table_name LIKE '%token%')
        ORDER BY table_name;
      `,
    })

    return NextResponse.json({
      verification_tokens: {
        exists: !vtError && verificationTokensSchema && verificationTokensSchema.length > 0,
        schema: verificationTokensSchema || [],
        error: vtError?.message,
      },
      email_verification_tokens: {
        exists: !evtError && emailVerificationTokensSchema && emailVerificationTokensSchema.length > 0,
        schema: emailVerificationTokensSchema || [],
        error: evtError?.message,
      },
      related_tables: relatedTables || [],
      related_tables_error: rtError?.message,
    })
  } catch (error) {
    console.error("Error checking table schema:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
