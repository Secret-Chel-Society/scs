import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Create the photos table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.photos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'general',
        file_path TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER,
        file_type TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS photos_category_idx ON public.photos(category);
      CREATE INDEX IF NOT EXISTS photos_created_at_idx ON public.photos(created_at);
      
      ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow admins full access" ON public.photos;
      CREATE POLICY "Allow admins full access" 
        ON public.photos 
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('Admin', 'League Manager')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('Admin', 'League Manager')
          )
        );
      
      DROP POLICY IF EXISTS "Allow all users to view" ON public.photos;
      CREATE POLICY "Allow all users to view" 
        ON public.photos 
        FOR SELECT
        USING (true);
    `

    // Execute the SQL directly
    const { error } = await supabase.rpc("exec_sql", { query: createTableSQL })

    if (error) {
      console.error("Error creating photos table:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in setup-photos-table:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
