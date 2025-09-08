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

    // 3. Authorization - Check admin role
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single()

    const isAdmin = userRole?.role?.toLowerCase().includes("admin") || 
                   userRole?.role?.toLowerCase().includes("superadmin")

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
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
