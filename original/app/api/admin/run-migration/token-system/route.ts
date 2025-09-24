import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("🚀 Starting token system migration...")

    // Read the migration file content
    const migrationSQL = `
-- Create tokens table for tracking user token balances
CREATE TABLE IF NOT EXISTS tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0 NOT NULL,
    season_id UUID REFERENCES seasons(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, season_id)
);

-- Create token_transactions table for tracking all token activity
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    description TEXT,
    reference_id UUID,
    admin_user_id UUID REFERENCES users(id),
    season_id UUID REFERENCES seasons(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_redeemables table for items players can buy
CREATE TABLE IF NOT EXISTS token_redeemables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    requires_approval BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    max_per_season INTEGER,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_redemptions table for tracking redemption requests
CREATE TABLE IF NOT EXISTS token_redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    redeemable_id UUID NOT NULL REFERENCES token_redeemables(id),
    tokens_spent INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    admin_user_id UUID REFERENCES users(id),
    season_id UUID REFERENCES seasons(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_raffles table for raffle management
CREATE TABLE IF NOT EXISTS token_raffles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entry_cost INTEGER NOT NULL,
    max_entries INTEGER,
    is_active BOOLEAN DEFAULT true,
    winner_user_id UUID REFERENCES users(id),
    prize_description TEXT,
    draw_date TIMESTAMP WITH TIME ZONE,
    season_id UUID REFERENCES seasons(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_raffle_entries table for tracking raffle entries
CREATE TABLE IF NOT EXISTS token_raffle_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    raffle_id UUID NOT NULL REFERENCES token_raffles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entries INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_season_id ON tokens(season_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_season_id ON token_transactions(season_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_token_redemptions_user_id ON token_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_redemptions_status ON token_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_token_raffle_entries_raffle_id ON token_raffle_entries(raffle_id);
CREATE INDEX IF NOT EXISTS idx_token_raffle_entries_user_id ON token_raffle_entries(user_id);
    `

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error("❌ Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Insert default redeemable items
    const { error: insertError } = await supabase.from("token_redeemables").upsert([
      {
        name: "One Week IR",
        description: "Place yourself on Injured Reserve for one week",
        cost: 15,
        requires_approval: true,
        category: "utility",
      },
      {
        name: "Trade Request",
        description: "Submit a formal trade request to management",
        cost: 25,
        requires_approval: true,
        category: "utility",
      },
      {
        name: "Unban Self",
        description: "Remove a ban from your account",
        cost: 50,
        requires_approval: true,
        category: "utility",
      },
      {
        name: "Unban Other Player",
        description: "Remove a ban from another player's account",
        cost: 50,
        requires_approval: true,
        category: "utility",
      },
      {
        name: "Tournament Fee Coverage",
        description: "Cover entry fee for next tournament",
        cost: 30,
        requires_approval: true,
        category: "tournament",
      },
      {
        name: "Cashout",
        description: "Convert 50 tokens to $25 CAD",
        cost: 50,
        requires_approval: true,
        category: "cashout",
      },
    ])

    if (insertError) {
      console.error("❌ Insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log("✅ Token system migration completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Token system migration completed successfully",
    })
  } catch (error: any) {
    console.error("❌ Migration failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
