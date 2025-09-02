import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  try {
    console.log("Running auto user creation migration...")

    const supabase = createAdminClient()

    // Read the SQL file content
    const sqlContent = `
-- Function to automatically create user profiles when auth users are confirmed
CREATE OR REPLACE FUNCTION public.handle_new_user_confirmation()
RETURNS trigger AS $$
DECLARE
    user_metadata jsonb;
    console_value text;
    gamer_tag text;
    primary_pos text;
    secondary_pos text;
BEGIN
    -- Only process if email_confirmed_at was just set (user just confirmed)
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        
        -- Log the event
        RAISE LOG 'Auto-creating user profile for confirmed user: % (%)', NEW.email, NEW.id;
        
        -- Get user metadata
        user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
        
        -- Extract and validate console value
        console_value := COALESCE(user_metadata->>'console', 'Xbox');
        IF console_value NOT IN ('Xbox', 'PS5') THEN
            IF console_value IN ('XSX', 'Xbox Series X', 'XBOX', 'xbox') THEN
                console_value := 'Xbox';
            ELSIF console_value IN ('PlayStation 5', 'PS', 'PlayStation', 'ps5') THEN
                console_value := 'PS5';
            ELSE
                console_value := 'Xbox';
            END IF;
        END IF;
        
        -- Extract other metadata
        gamer_tag := COALESCE(user_metadata->>'gamer_tag_id', split_part(NEW.email, '@', 1), 'Unknown');
        primary_pos := COALESCE(user_metadata->>'primary_position', 'Center');
        secondary_pos := user_metadata->>'secondary_position';
        
        -- Check if user already exists in public.users
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
            
            -- Create user record
            INSERT INTO public.users (
                id,
                email,
                gamer_tag_id,
                primary_position,
                secondary_position,
                console,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                NEW.email,
                gamer_tag,
                primary_pos,
                secondary_pos,
                console_value,
                true,
                NOW(),
                NOW()
            );
            
            RAISE LOG 'Created user record for: %', NEW.email;
            
        END IF;
        
        -- Check if player record exists
        IF NOT EXISTS (SELECT 1 FROM public.players WHERE user_id = NEW.id) THEN
            
            -- Create player record
            INSERT INTO public.players (
                user_id,
                role,
                salary
            ) VALUES (
                NEW.id,
                'Player',
                0
            );
            
            RAISE LOG 'Created player record for: %', NEW.email;
            
        END IF;
        
        -- Check if user role exists
        IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
            
            -- Create user role
            INSERT INTO public.user_roles (
                user_id,
                role
            ) VALUES (
                NEW.id,
                'Player'
            );
            
            RAISE LOG 'Created user role for: %', NEW.email;
            
        END IF;
        
        RAISE LOG 'Auto-creation completed for user: %', NEW.email;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_confirmation();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON public.users TO supabase_auth_admin;
GRANT INSERT ON public.players TO supabase_auth_admin;
GRANT INSERT ON public.user_roles TO supabase_auth_admin;
    `

    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlContent })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Auto user creation migration completed successfully")

    return NextResponse.json({
      success: true,
      message: "Auto user creation function and trigger created successfully",
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
