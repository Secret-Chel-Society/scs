import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: "Missing Supabase environment variables",
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }, { status: 500 })
    }

    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Get all users from auth system
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error("Error listing users:", listError)
      return NextResponse.json({ 
        error: `Auth error: ${listError.message}`,
        details: listError
      }, { status: 500 })
    }

    // Return user list (without sensitive data)
    const userList = users?.users?.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      is_anonymous: user.is_anonymous
    })) || []

    return NextResponse.json({
      success: true,
      totalUsers: userList.length,
      users: userList,
      searchFor: "rammer03@hotmail.com",
      found: userList.some(user => user.email?.toLowerCase() === "rammer03@hotmail.com")
    })
  } catch (error: any) {
    console.error("Error in debug auth-users route:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error
      },
      { status: 500 },
    )
  }
}
