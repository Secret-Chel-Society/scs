// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    
    console.log("🔧 FIXING ALL SYSTEMS...")

    const results = {
      ipTracking: { success: false, error: null },
      bidProcessing: { success: false, error: null },
      seasonSwitching: { success: false, error: null },
      biddingAuth: { success: false, error: null }
    }

    // Fix 1: IP Tracking
    console.log("🔧 Fixing IP Tracking...")
    try {
      // Add columns to users table
      await supabase.rpc('exec_sql', {
        query: `
          ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
          ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
        `
      })

      // Create ip_logs table
      await supabase.rpc('exec_sql', {
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

      // Create indexes
      await supabase.rpc('exec_sql', {
        query: `
          CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_address ON ip_logs(ip_address);
          CREATE INDEX IF NOT EXISTS idx_ip_logs_user_id ON ip_logs(user_id);
        `
      })

      // Create log_ip_address function
      await supabase.rpc('exec_sql', {
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
            INSERT INTO ip_logs (user_id, ip_address, action, user_agent)
            VALUES (p_user_id, p_ip_address, p_action, p_user_agent)
            RETURNING id INTO v_log_id;
            
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

      results.ipTracking.success = true
      console.log("✅ IP Tracking fixed")
    } catch (error: any) {
      results.ipTracking.error = error.message
      console.error("❌ IP Tracking fix failed:", error)
    }

    // Fix 2: Bid Processing
    console.log("🔧 Fixing Bid Processing...")
    try {
      await supabase.rpc('exec_sql', {
        query: `
          CREATE OR REPLACE FUNCTION public.process_bid_transaction(
            p_winner_id uuid,
            p_winning_amount integer,
            p_user_id uuid,
            p_bid_id uuid,
            p_player_id uuid
          ) 
          RETURNS jsonb
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result jsonb;
            v_player_exists boolean;
            v_bid_exists boolean;
            v_team_exists boolean;
            v_current_team_id uuid;
            v_old_salary integer;
            v_old_status text;
          BEGIN
            SELECT EXISTS(SELECT 1 FROM public.players WHERE id = p_player_id AND user_id = p_user_id),
                   team_id, salary, status
            INTO v_player_exists, v_current_team_id, v_old_salary, v_old_status
            FROM public.players 
            WHERE id = p_player_id;
            
            SELECT EXISTS(SELECT 1 FROM public.player_bidding WHERE id = p_bid_id AND player_id = p_player_id AND NOT finalized)
            INTO v_bid_exists;
            
            SELECT EXISTS(SELECT 1 FROM public.teams WHERE id = p_winner_id)
            INTO v_team_exists;
            
            IF NOT v_player_exists THEN
              RAISE EXCEPTION 'Player not found or invalid user association';
            END IF;
            
            IF NOT v_bid_exists THEN
              RAISE EXCEPTION 'Bid not found or already processed';
            END IF;
            
            IF NOT v_team_exists THEN
              RAISE EXCEPTION 'Team not found';
            END IF;
            
            BEGIN
              UPDATE public.players 
              SET 
                team_id = p_winner_id,
                salary = p_winning_amount,
                status = 'Active',
                updated_at = NOW()
              WHERE id = p_player_id;
              
              INSERT INTO public.player_transfers (
                player_id,
                from_team_id,
                to_team_id,
                transfer_amount,
                transfer_type,
                created_at
              ) VALUES (
                p_player_id,
                v_current_team_id,
                p_winner_id,
                p_winning_amount,
                'Bid Win',
                NOW()
              );
              
              UPDATE public.player_bidding 
              SET 
                finalized = true,
                status = 'Won',
                finalized_at = NOW()
              WHERE id = p_bid_id;
              
              UPDATE public.player_bidding 
              SET 
                status = 'Outbid',
                finalized_at = NOW()
              WHERE player_id = p_player_id 
                AND id != p_bid_id 
                AND NOT finalized;
              
              result := jsonb_build_object(
                'success', true,
                'message', 'Bid processed successfully',
                'player_id', p_player_id,
                'team_id', p_winner_id,
                'amount', p_winning_amount,
                'old_team_id', v_current_team_id,
                'old_salary', v_old_salary
              );
              
              RETURN result;
              
            EXCEPTION
              WHEN OTHERS THEN
                RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
            END;
          END;
          $$;
        `
      })

      results.bidProcessing.success = true
      console.log("✅ Bid Processing fixed")
    } catch (error: any) {
      results.bidProcessing.error = error.message
      console.error("❌ Bid Processing fix failed:", error)
    }

    // Fix 3: Season Switching (ensure system_settings table exists)
    console.log("🔧 Fixing Season Switching...")
    try {
      await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS system_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            key VARCHAR(255) UNIQUE NOT NULL,
            value TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })

      results.seasonSwitching.success = true
      console.log("✅ Season Switching fixed")
    } catch (error: any) {
      results.seasonSwitching.error = error.message
      console.error("❌ Season Switching fix failed:", error)
    }

    // Fix 4: Bidding Auth (ensure user_roles table exists)
    console.log("🔧 Fixing Bidding Auth...")
    try {
      await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS user_roles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })

      results.biddingAuth.success = true
      console.log("✅ Bidding Auth fixed")
    } catch (error: any) {
      results.biddingAuth.error = error.message
      console.error("❌ Bidding Auth fix failed:", error)
    }

    const successCount = Object.values(results).filter(r => r.success).length
    const totalSystems = Object.keys(results).length

    console.log(`🎉 ALL SYSTEMS FIX COMPLETED: ${successCount}/${totalSystems} systems fixed`)

    return NextResponse.json({
      success: successCount === totalSystems,
      message: `All systems fix completed: ${successCount}/${totalSystems} systems fixed`,
      results,
      summary: {
        totalSystems,
        fixedSystems: successCount,
        failedSystems: totalSystems - successCount
      }
    })

  } catch (error: any) {
    console.error("❌ Error fixing all systems:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
