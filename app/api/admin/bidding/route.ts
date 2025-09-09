import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import { z } from 'zod'
import { validateBody } from "@/lib/middleware/validation"
import { logger } from "@/lib/utils/logger"

// Schema for the request body
const toggleBiddingSchema = z.object({
  enabled: z.boolean({
    required_error: "enabled is required",
    invalid_type_error: "enabled must be a boolean",
  }),
  // Add other fields as needed
})

type ToggleBiddingInput = z.infer<typeof toggleBiddingSchema>

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // 1. Validate the request body
    const validation = await validateBody<ToggleBiddingInput>(
      request,
      toggleBiddingSchema
    )
    
    if (validation instanceof NextResponse) {
      return validation // Returns validation error response
    }
    
    const { enabled } = validation

    // 2. Authentication - Single, secure method
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // 3. Authorization - Check admin role with multiple fallbacks
    let isAdmin = false
    let userRole = null

    // Method 1: Check user_roles table
    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()

      if (!roleError && roleData) {
        userRole = roleData
        isAdmin = roleData.role === "Admin" || 
                 roleData.role === "SuperAdmin" ||
                 roleData.role?.toLowerCase().includes("admin")
        console.log("✅ Admin role found via user_roles:", { role: roleData.role, isAdmin })
      }
    } catch (error) {
      console.log("⚠️ user_roles check failed:", error)
    }

    // Method 2: Check if user is in admin_users table
    if (!isAdmin) {
      try {
        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("id")
          .eq("user_id", session.user.id)
          .single()

        if (!adminError && adminData) {
          isAdmin = true
          console.log("✅ Admin role found via admin_users table")
        }
      } catch (error) {
        console.log("⚠️ admin_users check failed:", error)
      }
    }

    // Method 3: Check if user email is in admin list (fallback)
    if (!isAdmin) {
      const adminEmails = [
        "zacha@midnightstudios.com",
        "admin@secretchelsociety.com",
        "zacha@secretchelsociety.com"
      ]
      
      if (session.user.email && adminEmails.includes(session.user.email.toLowerCase())) {
        isAdmin = true
        console.log("✅ Admin role found via email whitelist:", session.user.email)
      }
    }

    console.log("Final admin check result:", { 
      isAdmin, 
      userId: session.user.id, 
      email: session.user.email,
      userRole: userRole?.role 
    })

    if (!isAdmin) {
      console.log("❌ User is not an admin:", session.user.id)
      return NextResponse.json(
        { error: "Insufficient permissions - Admin role required" },
        { status: 403 }
      )
    }

    // 4. Update the bidding_enabled setting
    const { error } = await supabase
      .from("system_settings")
      .upsert(
        { 
          key: "bidding_enabled", 
          value: enabled,
          updated_by: session.user.id,
          updated_at: new Date().toISOString()
        },
        { onConflict: "key" }
      )

    if (error) {
      logger.error("Database error updating bidding status", error, {
        userId: session.user.id,
        action: 'update_bidding_status',
        ipAddress: headers().get('x-forwarded-for'),
        userAgent: headers().get('user-agent')
      });
      throw error;
    }

    // 5. Log the action
    logger.info(`Bidding ${enabled ? 'enabled' : 'disabled'}`, {
      userId: session.user.id,
      action: `bidding_${enabled ? 'enabled' : 'disabled'}`,
      ipAddress: headers().get('x-forwarded-for'),
      userAgent: headers().get('user-agent')
    })

    return NextResponse.json({
      success: true,
      enabled,
      message: `Bidding has been ${enabled ? 'enabled' : 'disabled'}`
    })
    
  } catch (error: any) {
    logger.error("Error in bidding API", error, {
      action: 'bidding_api_error',
      ipAddress: headers().get('x-forwarded-for'),
      userAgent: headers().get('user-agent')
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: "An error occurred while processing your request",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Add GET endpoint to check current bidding status
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: setting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "bidding_enabled")
      .single()

    return NextResponse.json({
      enabled: setting?.value ?? false
    })
    
  } catch (error) {
    console.error("Error fetching bidding status:", error)
    return NextResponse.json(
      { error: "Failed to fetch bidding status" },
      { status: 500 }
    )
  }
}
