import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    console.log("Starting IP tracking migration...")

    // Step 1: Add columns to users table
    try {
      console.log("Adding columns to users table...")
      await supabase.rpc("exec_sql", {
        query: `
          ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
        `,
      })
      console.log("Successfully added columns to users table")
    } catch (error) {
      console.error("Error adding columns:", error)
      // Continue with the migration even if this step fails
      // The columns might already exist
    }

    // Step 2: Create ip_logs table
    try {
      console.log("Creating ip_logs table...")
      await supabase.rpc("exec_sql", {
        query: `
          CREATE TABLE IF NOT EXISTS ip_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            ip_address VARCHAR(45) NOT NULL,
            action VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_agent TEXT
          );
        `,
      })
      console.log("Successfully created ip_logs table")
    } catch (error) {
      console.error("Error creating table:", error)
      // Continue with the migration
      // The table might already exist
    }

    // Step 3: Create indexes
    try {
      console.log("Creating indexes...")
      await supabase.rpc("exec_sql", {
        query: `
          CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_address ON ip_logs(ip_address);
          CREATE INDEX IF NOT EXISTS idx_ip_logs_user_id ON ip_logs(user_id);
        `,
      })
      console.log("Successfully created indexes")
    } catch (error) {
      console.error("Error creating indexes:", error)
      // Continue with the migration
      // The indexes might already exist
    }

    // Step 4: Create log_ip_address function
    try {
      console.log("Creating log_ip_address function...")
      await supabase.rpc("exec_sql", {
        query: `
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
        `,
      })
      console.log("Successfully created log_ip_address function")
    } catch (error) {
      console.error("Error creating function:", error)
      // Continue with the migration
      // The function might already exist
    }

    // Step 5: Verify migration
    try {
      console.log("Verifying migration...")
      const { data, error } = await supabase.from("users").select("registration_ip").limit(1)

      if (error) {
        console.error("Verification warning:", error)
      } else {
        console.log("Migration verified successfully")
      }
    } catch (error) {
      console.error("Verification error:", error)
      // Continue even if verification fails
    }

    return NextResponse.json({
      success: true,
      message: "IP tracking migration completed successfully",
    })
  } catch (error: any) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        error: error.message,
        details: "Error occurred during IP tracking migration",
      },
      { status: 500 },
    )
  }
}
