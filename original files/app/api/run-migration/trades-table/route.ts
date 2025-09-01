import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to run migrations" },
        { status: 401 },
      )
    }

    // Check if user is an admin
    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("role")
      .eq("auth_id", user.id)
      .single()

    if (playerError || !playerData || playerData.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden", message: "Only admins can run migrations" }, { status: 403 })
    }

    // Execute the SQL to create the trades table
    const { error } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.trades (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          team1_id UUID NOT NULL REFERENCES public.teams(id),
          team2_id UUID NOT NULL REFERENCES public.teams(id),
          team1_players JSONB NOT NULL DEFAULT '[]'::jsonb,
          team2_players JSONB NOT NULL DEFAULT '[]'::jsonb,
          trade_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );
        
        -- Add RLS policies
        ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
        
        -- Allow anyone to read trades
        CREATE POLICY IF NOT EXISTS "Trades are viewable by everyone" 
        ON public.trades FOR SELECT 
        USING (true);
        
        -- Only authenticated users can insert trades
        CREATE POLICY IF NOT EXISTS "Authenticated users can insert trades" 
        ON public.trades FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
        
        -- Only admins can update or delete trades
        CREATE POLICY IF NOT EXISTS "Only admins can update trades" 
        ON public.trades FOR UPDATE 
        TO authenticated 
        USING (
          auth.uid() IN (
            SELECT auth.uid() 
            FROM public.players 
            WHERE role = 'Admin'
          )
        );
        
        CREATE POLICY IF NOT EXISTS "Only admins can delete trades" 
        ON public.trades FOR DELETE 
        TO authenticated 
        USING (
          auth.uid() IN (
            SELECT auth.uid() 
            FROM public.players 
            WHERE role = 'Admin'
          )
        );
      `,
    })

    if (error) {
      console.error("Error running migration:", error)
      return NextResponse.json({ error: "Migration failed", message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Trades table created successfully" })
  } catch (error: any) {
    console.error("Error in trades table migration:", error)
    return NextResponse.json({ error: "Server error", message: error.message }, { status: 500 })
  }
}
