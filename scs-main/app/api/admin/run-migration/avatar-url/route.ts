import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Verify user is authenticated and has admin role
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user has admin role
  const { data: userRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)

  if (rolesError) {
    return NextResponse.json({ error: "Failed to verify admin status" }, { status: 500 })
  }

  const isAdmin = userRoles.some((ur) => ur.role === "admin")
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }

  try {
    // SQL to add avatar_url column if it doesn't exist
    const sql = `
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'avatar_url'
          ) THEN
              ALTER TABLE public.users
              ADD COLUMN avatar_url TEXT;
          END IF;
      END $$;
    `

    // Try using exec_sql function first
    const { error: execError } = await supabase.rpc("exec_sql", { sql_query: sql })

    // If exec_sql fails, try run_sql function
    if (execError) {
      const { error: runError } = await supabase.rpc("run_sql", { query: sql })

      if (runError) {
        // If both methods fail, try direct SQL execution
        const { error: directError } = await supabase.from("_exec_sql").insert({ sql })

        if (directError) {
          return NextResponse.json({ error: `Migration failed: ${directError.message}` }, { status: 500 })
        }
      }
    }

    // Verify the column was added
    const { data: columnCheck, error: checkError } = await supabase.rpc("exec_sql", {
      sql_query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'avatar_url'
      `,
    })

    if (checkError || !columnCheck || columnCheck.length === 0) {
      return NextResponse.json({ error: "Migration verification failed" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: `Migration failed: ${error.message}` }, { status: 500 })
  }
}
