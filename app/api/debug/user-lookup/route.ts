import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    // Check if required environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: "Missing Supabase environment variables"
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

    const normalizedEmail = email.toLowerCase().trim()

    // Check in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: normalizedEmail,
      },
    })

    // Check in public.users table
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      authUsers: {
        found: authUsers?.users?.length > 0,
        count: authUsers?.users?.length || 0,
        users: authUsers?.users?.map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at
        })) || [],
        error: authError?.message
      },
      publicUsers: {
        found: (publicUsers?.length || 0) > 0,
        count: publicUsers?.length || 0,
        users: publicUsers || [],
        error: publicError?.message
      }
    })
  } catch (error: any) {
    console.error("Error in debug user-lookup route:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error
      },
      { status: 500 },
    )
  }
}
