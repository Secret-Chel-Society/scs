import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const teamId = searchParams.get("teamId")
    const userId = searchParams.get("userId")
    const status = searchParams.get("status") || "active"
    const weekStart = searchParams.get("weekStart")
    const weekEnd = searchParams.get("weekEnd")

    let query = supabase.from("injury_reserves").select(`
        id,
        user_id,
        team_id,
        season_id,
        week_start_date,
        week_end_date,
        week_number,
        status,
        reason,
        created_at,
        updated_at,
        users(id, gamer_tag_id, email),
        teams(id, name, logo_url)
      `)

    // Apply filters
    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Filter by week range if provided
    if (weekStart && weekEnd) {
      query = query.lte("week_start_date", weekEnd).gte("week_end_date", weekStart)
    }

    const { data: injuryReserves, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching injury reserves:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: injuryReserves || [] })
  } catch (error: any) {
    console.error("Error in injury reserves GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const {
      user_id,
      userId,
      team_id,
      teamId,
      season_id,
      seasonId,
      week_start_date,
      weekStartDate,
      week_end_date,
      weekEndDate,
      week_number,
      weekNumber,
      reason,
    } = body

    // Handle both camelCase and snake_case field names
    const finalUserId = user_id || userId
    const finalTeamId = team_id || teamId
    const finalSeasonId = season_id || seasonId
    const finalWeekStartDate = week_start_date || weekStartDate
    const finalWeekEndDate = week_end_date || weekEndDate
    const finalWeekNumber = week_number || weekNumber

    if (!finalUserId || !finalTeamId || !finalWeekStartDate || !finalWeekEndDate) {
      return NextResponse.json(
        {
          error: "Missing required fields: user_id, team_id, week_start_date, week_end_date",
        },
        { status: 400 },
      )
    }

    // Validate dates
    const startDate = new Date(finalWeekStartDate)
    const endDate = new Date(finalWeekEndDate)

    if (startDate >= endDate) {
      return NextResponse.json(
        {
          error: "Week start date must be before end date",
        },
        { status: 400 },
      )
    }

    // Check for overlapping injury reserves for the same user and team
    const { data: existingReserves, error: checkError } = await supabase
      .from("injury_reserves")
      .select("id, week_start_date, week_end_date")
      .eq("user_id", finalUserId)
      .eq("team_id", finalTeamId)
      .eq("status", "active")
      .or(`week_start_date.lte.${finalWeekEndDate},week_end_date.gte.${finalWeekStartDate}`)

    if (checkError) {
      console.error("Error checking existing reserves:", checkError)
      return NextResponse.json({ error: "Failed to check for overlapping reserves" }, { status: 500 })
    }

    if (existingReserves && existingReserves.length > 0) {
      return NextResponse.json(
        {
          error: "Player already has an active injury reserve that overlaps with this period",
        },
        { status: 409 },
      )
    }

    // Verify player exists on the team
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", finalUserId)
      .eq("team_id", finalTeamId)
      .single()

    if (playerError || !player) {
      return NextResponse.json(
        {
          error: "Player not found on the specified team",
        },
        { status: 404 },
      )
    }

    // Create the injury reserve
    const { data: newReserve, error: insertError } = await supabase
      .from("injury_reserves")
      .insert({
        user_id: finalUserId,
        team_id: finalTeamId,
        season_id: finalSeasonId,
        week_start_date: finalWeekStartDate,
        week_end_date: finalWeekEndDate,
        week_number: finalWeekNumber,
        reason: reason || null,
        status: "active",
      })
      .select(`
        id,
        user_id,
        team_id,
        season_id,
        week_start_date,
        week_end_date,
        week_number,
        status,
        reason,
        created_at,
        updated_at,
        users(id, gamer_tag_id, email),
        teams(id, name, logo_url)
      `)
      .single()

    if (insertError) {
      console.error("Error creating injury reserve:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Now mark the player as unavailable for all games in this week
    try {
      // Get all matches for this team during the IR period
      const { data: matches, error: matchError } = await supabase
        .from("matches")
        .select("id")
        .or(`home_team_id.eq.${finalTeamId},away_team_id.eq.${finalTeamId}`)
        .gte("match_date", finalWeekStartDate)
        .lte("match_date", finalWeekEndDate)

      if (matchError) {
        console.error("Error fetching matches for IR period:", matchError)
      } else if (matches && matches.length > 0) {
        // Create game availability records for each match
        const availabilityRecords = matches.map((match) => ({
          match_id: match.id,
          user_id: finalUserId,
          status: "injury_reserve",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        // Insert availability records (ignore conflicts if they already exist)
        const { error: availabilityError } = await supabase.from("game_availability").upsert(availabilityRecords, {
          onConflict: "match_id,user_id",
          ignoreDuplicates: false,
        })

        if (availabilityError) {
          console.error("Error creating game availability records:", availabilityError)
          // Don't fail the IR creation if availability records fail
        }
      }
    } catch (availabilityError) {
      console.error("Error handling game availability for IR:", availabilityError)
      // Don't fail the IR creation if availability handling fails
    }

    return NextResponse.json(
      {
        success: true,
        data: newReserve,
        injuryReserve: newReserve, // For backward compatibility
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error in injury reserves POST:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { id, week_start_date, week_end_date, reason, status } = body

    if (!id) {
      return NextResponse.json({ error: "Injury reserve ID is required" }, { status: 400 })
    }

    // Validate dates if provided
    if (week_start_date && week_end_date) {
      const startDate = new Date(week_start_date)
      const endDate = new Date(week_end_date)

      if (startDate >= endDate) {
        return NextResponse.json(
          {
            error: "Week start date must be before end date",
          },
          { status: 400 },
        )
      }
    }

    // Get the existing reserve to check for overlaps
    const { data: existingReserve, error: existingError } = await supabase
      .from("injury_reserves")
      .select("user_id, team_id")
      .eq("id", id)
      .single()

    if (existingError || !existingReserve) {
      return NextResponse.json({ error: "Injury reserve not found" }, { status: 404 })
    }

    // If updating dates, check for overlaps with other active reserves
    if (week_start_date && week_end_date) {
      const { data: overlappingReserves, error: overlapError } = await supabase
        .from("injury_reserves")
        .select("id")
        .eq("user_id", existingReserve.user_id)
        .eq("team_id", existingReserve.team_id)
        .eq("status", "active")
        .neq("id", id)
        .or(`week_start_date.lte.${week_end_date},week_end_date.gte.${week_start_date}`)

      if (overlapError) {
        console.error("Error checking overlapping reserves:", overlapError)
        return NextResponse.json({ error: "Failed to check for overlapping reserves" }, { status: 500 })
      }

      if (overlappingReserves && overlappingReserves.length > 0) {
        return NextResponse.json(
          {
            error: "Updated dates would overlap with another active injury reserve",
          },
          { status: 409 },
        )
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (week_start_date) updateData.week_start_date = week_start_date
    if (week_end_date) updateData.week_end_date = week_end_date
    if (reason !== undefined) updateData.reason = reason
    if (status) updateData.status = status

    // Update the injury reserve
    const { data: updatedReserve, error: updateError } = await supabase
      .from("injury_reserves")
      .update(updateData)
      .eq("id", id)
      .select(`
        id,
        user_id,
        team_id,
        season_id,
        week_start_date,
        week_end_date,
        week_number,
        status,
        reason,
        created_at,
        updated_at,
        users(id, gamer_tag_id, email),
        teams(id, name, logo_url)
      `)
      .single()

    if (updateError) {
      console.error("Error updating injury reserve:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedReserve,
    })
  } catch (error: any) {
    console.error("Error in injury reserves PUT:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Injury reserve ID is required" }, { status: 400 })
    }

    // Get the injury reserve details before deletion
    const { data: existingReserve, error: existingError } = await supabase
      .from("injury_reserves")
      .select("user_id, team_id, week_start_date, week_end_date")
      .eq("id", id)
      .single()

    if (existingError || !existingReserve) {
      return NextResponse.json({ error: "Injury reserve not found" }, { status: 404 })
    }

    // Delete the injury reserve
    const { error: deleteError } = await supabase.from("injury_reserves").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting injury reserve:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Remove the injury_reserve game availability records for this period
    try {
      const { data: matches, error: matchError } = await supabase
        .from("matches")
        .select("id")
        .or(`home_team_id.eq.${existingReserve.team_id},away_team_id.eq.${existingReserve.team_id}`)
        .gte("match_date", existingReserve.week_start_date)
        .lte("match_date", existingReserve.week_end_date)

      if (!matchError && matches && matches.length > 0) {
        const matchIds = matches.map((m) => m.id)

        // Delete injury_reserve availability records
        const { error: availabilityDeleteError } = await supabase
          .from("game_availability")
          .delete()
          .eq("user_id", existingReserve.user_id)
          .eq("status", "injury_reserve")
          .in("match_id", matchIds)

        if (availabilityDeleteError) {
          console.error("Error deleting game availability records:", availabilityDeleteError)
        }
      }
    } catch (availabilityError) {
      console.error("Error handling game availability cleanup:", availabilityError)
    }

    return NextResponse.json({
      success: true,
      message: "Injury reserve deleted successfully",
    })
  } catch (error: any) {
    console.error("Error in injury reserves DELETE:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
