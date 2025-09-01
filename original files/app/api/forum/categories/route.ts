import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Simple in-memory cache with 5-minute expiration
let categoriesCache: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

export async function GET() {
  try {
    // Check if we have a valid cache
    const now = Date.now()
    if (categoriesCache && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(categoriesCache)
    }

    const supabase = createClient()

    // Simple, direct query with minimal operations
    const { data: categories, error } = await supabase
      .from("forum_categories")
      .select("id, name, color, description, admin_only")
      .order("name")

    if (error) {
      console.error("Database error:", error)
      // Return hardcoded categories as fallback
      return NextResponse.json({
        categories: [
          { id: "1", name: "General", color: "#3b82f6", description: "General discussion", admin_only: false },
        ],
      })
    }

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let availableCategories = categories || []

    // If user is authenticated, check if they're admin
    if (user) {
      try {
        const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", user.id)
        const isAdmin = userRoles?.some((ur) => ur.role === "Admin") || false

        // If not admin, filter out admin-only categories
        if (!isAdmin) {
          availableCategories = categories?.filter((cat) => !cat.admin_only) || []
        }
      } catch (roleError) {
        console.error("Error checking user roles:", roleError)
        // If role check fails, show non-admin categories only
        availableCategories = categories?.filter((cat) => !cat.admin_only) || []
      }
    } else {
      // Not authenticated, show only non-admin categories
      availableCategories = categories?.filter((cat) => !cat.admin_only) || []
    }

    // Update cache
    categoriesCache = { categories: availableCategories }
    cacheTimestamp = now

    return NextResponse.json(categoriesCache)
  } catch (error) {
    console.error("API error:", error)
    // Always return something, never fail completely
    return NextResponse.json({
      categories: [
        { id: "1", name: "General", color: "#3b82f6", description: "General discussion", admin_only: false },
      ],
    })
  }
}
