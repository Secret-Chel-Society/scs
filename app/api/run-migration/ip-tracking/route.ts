import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const { data: adminRole, error: adminRoleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("role", "Admin")
      .single()

    if (adminRoleError || !adminRole) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Read the SQL file content
    const sql = `
    -- Add IP address tracking to users table
    ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

    -- Create a table to track IP history
    CREATE TABLE IF NOT EXISTS ip_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip_address VARCHAR(45) NOT NULL,
      action VARCHAR(50) NOT NULL, -- 'register', 'login', etc.
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      user_agent TEXT
    );

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_address ON ip_logs(ip_address);
    CREATE INDEX IF NOT EXISTS idx_ip_logs_user_id ON ip_logs(user_id);

    -- Create a function to log IP addresses
    CREATE OR REPLACE FUNCTION log_ip_address(
      p_user_id UUID,
      p_ip_address VARCHAR(45),
      p_action VARCHAR(50),
      p_user_agent TEXT DEFAULT NULL
    ) RETURNS UUID AS $$
    DECLARE
      v_log_id UUID;
    BEGIN
      -- Insert into ip_logs
      INSERT INTO ip_logs (user_id, ip_address, action, user_agent)
      VALUES (p_user_id, p_ip_address, p_action, p_user_agent)
      RETURNING id INTO v_log_id;
      
      -- Update the users table based on the action
      IF p_action = 'register' THEN
        UPDATE users SET registration_ip = p_ip_address WHERE id = p_user_id;
      ELSIF p_action = 'login' THEN
        UPDATE users SET last_login_ip = p_ip_address, last_login_at = NOW() WHERE id = p_user_id;
      END IF;
      
      RETURN v_log_id;
    END;
    $$ LANGUAGE plpgsql;
    `

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (sqlError) {
      console.error("Error executing SQL:", sqlError)
      return NextResponse.json({ error: sqlError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "IP tracking migration completed successfully" })
  } catch (error: any) {
    console.error("Error in IP tracking migration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
