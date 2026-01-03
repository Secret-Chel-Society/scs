import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export const dynamic = "force-dynamic"

export async function POST() {
  // IMPORTANT: call cookies() inside the handler so it’s in request scope
  const cookieStore = cookies()

  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore,
  })

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: playerData, error: playerError } = await supabase
      .from("players")
      .select("role, team_id, team_id_ahl")
      .eq("user_id", user.id)

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 })
    }

    const isManager = (playerData ?? []).some((p) => ["GM", "AGM", "Owner"].includes(p.role))
    if (!isManager) {
      return NextResponse.json({ error: "Only team managers can run this migration" }, { status: 403 })
    }

    // NOTE: uuid_generate_v4() vs extensions.uuid_generate_v4()
    // Use extensions.uuid_generate_v4() since your schema uses extensions.uuid_generate_v4()
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.lineups (
        id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
        match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
        team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
        player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
        position varchar(10) NOT NULL,
        line_number int NOT NULL DEFAULT 1,
        is_starter boolean DEFAULT TRUE,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(match_id, team_id, player_id)
      );
    `

    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_lineups_match_id ON public.lineups(match_id);
      CREATE INDEX IF NOT EXISTS idx_lineups_team_id ON public.lineups(team_id);
      CREATE INDEX IF NOT EXISTS idx_lineups_player_id ON public.lineups(player_id);
    `

    const createTriggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.update_lineups_modified_column()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS update_lineups_modtime ON public.lineups;
      CREATE TRIGGER update_lineups_modtime
      BEFORE UPDATE ON public.lineups
      FOR EACH ROW
      EXECUTE FUNCTION public.update_lineups_modified_column();
    `

    // Run SQL through your exec_sql RPC
    // IMPORTANT: exec_sql must be SECURITY DEFINER or service-role protected.
    const r1 = await supabase.rpc("exec_sql", { sql: createTableSQL })
    if (r1.error) return NextResponse.json({ error: r1.error.message }, { status: 500 })

    const r2 = await supabase.rpc("exec_sql", { sql: createIndexesSQL })
    if (r2.error) return NextResponse.json({ error: r2.error.message }, { status: 500 })

    const r3 = await supabase.rpc("exec_sql", { sql: createTriggerFunctionSQL })
    if (r3.error) return NextResponse.json({ error: r3.error.message }, { status: 500 })

    const r4 = await supabase.rpc("exec_sql", { sql: createTriggerSQL })
    if (r4.error) return NextResponse.json({ error: r4.error.message }, { status: 500 })

    return NextResponse.json({ success: true, message: "Lineups table created successfully" })
  } catch (err: any) {
    console.error("Error creating lineups table:", err)
    return NextResponse.json(
      { error: "Failed to create lineups table", details: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
