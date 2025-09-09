import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { adminKey } = await request.json()

    if (adminKey !== process.env.ADMIN_VERIFICATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
    }

    console.log("Running forum tables migration...")

    // Read the migration file content
    const migrationSQL = `
      -- Create forum categories table
      CREATE TABLE IF NOT EXISTS forum_categories (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create forum posts table
      CREATE TABLE IF NOT EXISTS forum_posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES forum_categories(id) ON DELETE SET NULL,
        pinned BOOLEAN DEFAULT FALSE,
        locked BOOLEAN DEFAULT FALSE,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create forum comments table
      CREATE TABLE IF NOT EXISTS forum_comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        content TEXT NOT NULL,
        author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create forum votes table (for likes/dislikes)
      CREATE TABLE IF NOT EXISTS forum_votes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
        comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
        vote_type VARCHAR(10) CHECK (vote_type IN ('like', 'dislike')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, post_id),
        UNIQUE(user_id, comment_id),
        CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
      );

      -- Insert default categories
      INSERT INTO forum_categories (name, description, color) VALUES
        ('General Discussion', 'General hockey and league discussion', '#3B82F6'),
        ('Team Talk', 'Discuss your teams and strategies', '#10B981'),
        ('Game Results', 'Post and discuss game results', '#F59E0B'),
        ('Trading Block', 'Player trades and free agency', '#EF4444'),
        ('Technical Support', 'Get help with technical issues', '#8B5CF6')
      ON CONFLICT DO NOTHING;

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id);
      CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_forum_comments_author ON forum_comments(author_id);
      CREATE INDEX IF NOT EXISTS idx_forum_votes_post ON forum_votes(post_id);
      CREATE INDEX IF NOT EXISTS idx_forum_votes_comment ON forum_votes(comment_id);
      CREATE INDEX IF NOT EXISTS idx_forum_votes_user ON forum_votes(user_id);

      -- Enable RLS
      ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;

      -- RLS Policies
      -- Categories: Everyone can read
      DROP POLICY IF EXISTS "Anyone can view forum categories" ON forum_categories;
      CREATE POLICY "Anyone can view forum categories" ON forum_categories FOR SELECT USING (true);

      -- Posts: Everyone can read, authenticated users can create, authors can update/delete
      DROP POLICY IF EXISTS "Anyone can view forum posts" ON forum_posts;
      DROP POLICY IF EXISTS "Authenticated users can create posts" ON forum_posts;
      DROP POLICY IF EXISTS "Authors can update their posts" ON forum_posts;
      DROP POLICY IF EXISTS "Authors can delete their posts" ON forum_posts;
      
      CREATE POLICY "Anyone can view forum posts" ON forum_posts FOR SELECT USING (true);
      CREATE POLICY "Authenticated users can create posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
      CREATE POLICY "Authors can update their posts" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);
      CREATE POLICY "Authors can delete their posts" ON forum_posts FOR DELETE USING (auth.uid() = author_id);

      -- Comments: Everyone can read, authenticated users can create, authors can update/delete
      DROP POLICY IF EXISTS "Anyone can view forum comments" ON forum_comments;
      DROP POLICY IF EXISTS "Authenticated users can create comments" ON forum_comments;
      DROP POLICY IF EXISTS "Authors can update their comments" ON forum_comments;
      DROP POLICY IF EXISTS "Authors can delete their comments" ON forum_comments;
      
      CREATE POLICY "Anyone can view forum comments" ON forum_comments FOR SELECT USING (true);
      CREATE POLICY "Authenticated users can create comments" ON forum_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
      CREATE POLICY "Authors can update their comments" ON forum_comments FOR UPDATE USING (auth.uid() = author_id);
      CREATE POLICY "Authors can delete their comments" ON forum_comments FOR DELETE USING (auth.uid() = author_id);

      -- Votes: Users can manage their own votes
      DROP POLICY IF EXISTS "Users can view all votes" ON forum_votes;
      DROP POLICY IF EXISTS "Users can create their own votes" ON forum_votes;
      DROP POLICY IF EXISTS "Users can update their own votes" ON forum_votes;
      DROP POLICY IF EXISTS "Users can delete their own votes" ON forum_votes;
      
      CREATE POLICY "Users can view all votes" ON forum_votes FOR SELECT USING (true);
      CREATE POLICY "Users can create their own votes" ON forum_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own votes" ON forum_votes FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete their own votes" ON forum_votes FOR DELETE USING (auth.uid() = user_id);
    `

    const { error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: migrationSQL,
    })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Forum tables migration completed successfully")
    return NextResponse.json({
      success: true,
      message: "Forum tables created successfully with RLS policies",
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        error: "Failed to run migration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
