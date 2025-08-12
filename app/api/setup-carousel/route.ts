import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Create the carousel_images table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.carousel_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS carousel_images_order_idx ON public.carousel_images("order");
      
      ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow admins full access" ON public.carousel_images;
      CREATE POLICY "Allow admins full access" 
        ON public.carousel_images 
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
      
      DROP POLICY IF EXISTS "Allow all users to view" ON public.carousel_images;
      CREATE POLICY "Allow all users to view" 
        ON public.carousel_images 
        FOR SELECT
        USING (true);
    `

    // Execute the SQL directly
    const { error } = await supabase.rpc("exec_sql", { query: createTableSQL })

    if (error) {
      console.error("Error creating carousel table:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in setup-carousel route:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
