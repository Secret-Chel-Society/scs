import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { userId, roles } = await request.json()

  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .in("role", ["Admin", "Owner"])

    if (!adminRoles || adminRoles.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Validate input
    if (!userId || !Array.isArray(roles)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    // Get valid roles from the database
    const { data: validRolesData } = await supabase
      .rpc("exec_sql", {
        sql_query: "SELECT consrc FROM pg_constraint WHERE conname = 'user_roles_role_check'",
      })

    let validRoles = ["Player", "GM", "AGM", "Owner", "Admin"] // Default fallback
    
    if (validRolesData && validRolesData.length > 0) {
      const constraint = validRolesData[0].consrc
      const matches = constraint.match(/'([^']+)'/g)
      if (matches) {
        validRoles = matches.map((m: string) => m.replace(/'/g, ""))
      }
    }

    // Validate roles against allowed values
    const invalidRoles = roles.filter((role) => !validRoles.includes(role))
    if (invalidRoles.length > 0) {
      return NextResponse.json(
        { error: `Invalid role(s): ${invalidRoles.join(", ")}` },
        { status: 400 }
      )
    }

    // Start a transaction
    const { data, error } = await supabase.rpc("exec_sql", {
      sql_query: `
        BEGIN;
        
        -- Delete existing roles for the user
        DELETE FROM user_roles WHERE user_id = '${userId}';
        
        -- Insert new roles
        ${roles
          .map((role) => `
            INSERT INTO user_roles (user_id, role) 
            VALUES ('${userId}', '${role}');
          `)
          .join("\n")}
        
        COMMIT;
      `,
    })

    if (error) {
      await supabase.rpc("exec_sql", { sql_query: "ROLLBACK;" })
      console.error("Error updating user roles:", error)
      return NextResponse.json(
        { error: "Failed to update user roles" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "User roles updated successfully",
    })
  } catch (error) {
    console.error("Error in update-roles endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
