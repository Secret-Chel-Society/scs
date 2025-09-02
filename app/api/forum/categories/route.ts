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

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Authentication error:", authError)
      return NextResponse.json({ error: "Authentication error: " + authError.message }, { status: 401 })
    }

    if (!user) {
      console.error("No authenticated user found")
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError)
      return NextResponse.json({ error: "Error checking permissions: " + rolesError.message }, { status: 500 })
    }

    const isAdmin = userRoles?.some((ur) => ur.role === "Admin") || false

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { name, description, color, admin_only } = requestBody

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    // Check if category name already exists
    const { data: existingCategory, error: checkError } = await supabase
      .from("forum_categories")
      .select("id")
      .eq("name", name.trim())
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing category:", checkError)
      return NextResponse.json({ error: "Database error while checking category name" }, { status: 500 })
    }

    if (existingCategory) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 400 })
    }

    // Create the category
    const { data: category, error: insertError } = await supabase
      .from("forum_categories")
      .insert({
        name: name.trim(),
        description: description || "",
        color: color || "#3b82f6",
        admin_only: admin_only || false,
      })
      .select("*")
      .single()

    if (insertError) {
      console.error("Error creating category:", insertError)
      return NextResponse.json({ error: "Database error: " + insertError.message }, { status: 500 })
    }

    // Clear cache to ensure fresh data
    categoriesCache = null
    cacheTimestamp = 0

    console.log("Category created successfully:", category.id)
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("Error in forum categories POST API:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
