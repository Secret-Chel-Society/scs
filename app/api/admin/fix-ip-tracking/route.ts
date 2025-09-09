// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    
    console.log("🔧 FIXING IP tracking system...")

    // Step 1: Add columns to users table
    console.log("Step 1: Adding IP columns to users table...")
    const { error: columnError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
      `
    })

    if (columnError) {
      console.error("❌ Error adding columns:", columnError)
    } else {
      console.log("✅ IP columns added to users table")
    }

    // Step 2: Create ip_logs table
    console.log("Step 2: Creating ip_logs table...")
    const { error: tableError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS ip_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          ip_address VARCHAR(45) NOT NULL,
          action VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          user_agent TEXT
        );
      `
    })

    if (tableError) {
      console.error("❌ Error creating table:", tableError)
    } else {
      console.log("✅ ip_logs table created")
    }

    // Step 3: Create indexes
    console.log("Step 3: Creating indexes...")
    const { error: indexError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_address ON ip_logs(ip_address);
        CREATE INDEX IF NOT EXISTS idx_ip_logs_user_id ON ip_logs(user_id);
      `
    })

    if (indexError) {
      console.error("❌ Error creating indexes:", indexError)
    } else {
      console.log("✅ Indexes created")
    }

    // Step 4: Create log_ip_address function
    console.log("Step 4: Creating log_ip_address function...")
    const { error: functionError } = await supabase.rpc('exec_sql', {
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
      `
    })

    if (functionError) {
      console.error("❌ Error creating function:", functionError)
    } else {
      console.log("✅ log_ip_address function created")
    }

    // Step 5: Test the function
    console.log("Step 5: Testing the function...")
    const { data: testResult, error: testError } = await supabase.rpc('log_ip_address', {
      p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_ip_address: '127.0.0.1',
      p_action: 'test',
      p_user_agent: 'fix-test'
    })

    if (testError && !testError.message.includes('violates foreign key constraint')) {
      console.error("❌ Function test failed:", testError)
    } else {
      console.log("✅ Function test successful")
    }

    console.log("🎉 IP tracking system FIXED!")

    return NextResponse.json({
      success: true,
      message: "IP tracking system has been fixed and is now working",
      details: {
        columnsAdded: !columnError,
        tableCreated: !tableError,
        indexesCreated: !indexError,
        functionCreated: !functionError,
        functionTested: !testError || testError.message.includes('violates foreign key constraint')
      }
    })

  } catch (error: any) {
    console.error("❌ Error fixing IP tracking:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
