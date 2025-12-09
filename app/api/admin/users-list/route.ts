import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const rawLimit = Math.max(parseInt(searchParams.get("limit") || "25", 10), 1)
    const limit = Math.min(rawLimit, 1000) // hard cap
    const search = (searchParams.get("search") || "").trim()

    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = createAdminClient()

    // Columns needed on frontend
    const columns = `
      id,
      gamer_tag_id,
      gamer_tag,
      email,
      discord_name,
      ban_reason,
      ban_expiration,
      created_at
    `

    // Build base query with exact count
    let query = supabase
      .from("users")
      .select(columns, { count: "exact" })

    if (search) {
      // sanitize %/_ from user input to avoid unintended wildcards
      const safe = search.replace(/[%_]/g, "")
      const term = `%${safe}%`
      // PostgREST OR across multiple columns
      query = query.or(
        [
          `gamer_tag_id.ilike.${term}`,
          `discord_name.ilike.${term}`,
          `gamer_tag.ilike.${term}`,
          `email.ilike.${term}`,
        ].join(",")
      )
    }

    // Order + paginate AFTER filters
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("users-list query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const usersWithBanStatus =
      (data || []).map((u) => ({
        ...u,
        is_banned: !!u.ban_reason,
      }))

    return NextResponse.json({
      users: usersWithBanStatus,
      total: count ?? 0,
      page,
      limit,
    })
  } catch (e: any) {
    console.error("users-list GET fatal:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
