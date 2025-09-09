// Midnight Studios INTl - All rights reserved
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    
    console.log("🧪 Testing season switching functionality...")

    // Get all seasons
    const { data: seasons, error: seasonsError } = await supabase
      .from("seasons")
      .select("*")
      .order("created_at", { ascending: false })

    if (seasonsError) {
      console.error("❌ Error fetching seasons:", seasonsError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch seasons: ${seasonsError.message}`
      }, { status: 500 })
    }

    if (!seasons || seasons.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No seasons found to test with",
        testResults: {
          seasonsFound: 0,
          canTest: false
        }
      })
    }

    console.log("📋 Found seasons:", seasons.map(s => ({ id: s.id, name: s.name, is_active: s.is_active })))

    // Find current active season
    const currentActiveSeason = seasons.find(s => s.is_active === true)
    console.log("🎯 Current active season:", currentActiveSeason)

    // Find a different season to switch to
    const targetSeason = seasons.find(s => s.id !== currentActiveSeason?.id)
    
    if (!targetSeason) {
      return NextResponse.json({
        success: true,
        message: "Only one season found, cannot test switching",
        testResults: {
          seasonsFound: seasons.length,
          canTest: false,
          currentActive: currentActiveSeason
        }
      })
    }

    console.log("🎯 Target season for switching:", targetSeason)

    // Test the season switching logic
    const testResults = {
      beforeSwitch: {
        currentActive: currentActiveSeason,
        allSeasons: seasons
      },
      switchAttempt: null,
      afterSwitch: null,
      systemSettings: null
    }

    try {
      console.log("🔄 Attempting to switch to season:", targetSeason.name)
      
      // Step 1: Set all seasons to inactive
      const { error: updateAllError } = await supabase
        .from("seasons")
        .update({ is_active: false })
        .neq("id", "placeholder") // Update all rows

      if (updateAllError) {
        console.error("❌ Error setting all seasons inactive:", updateAllError)
        testResults.switchAttempt = { success: false, error: updateAllError.message }
      } else {
        console.log("✅ All seasons set to inactive")
        
        // Step 2: Set target season to active
        const { error: updateTargetError } = await supabase
          .from("seasons")
          .update({ is_active: true })
          .eq("id", targetSeason.id)

        if (updateTargetError) {
          console.error("❌ Error setting target season active:", updateTargetError)
          testResults.switchAttempt = { success: false, error: updateTargetError.message }
        } else {
          console.log("✅ Target season set to active")
          
          // Step 3: Update system_settings
          try {
            const { error: settingsError } = await supabase
              .from("system_settings")
              .upsert({ key: "current_season", value: targetSeason.id })
              .eq("key", "current_season")

            if (settingsError) {
              console.warn("⚠️ Could not update system_settings:", settingsError.message)
            } else {
              console.log("✅ System settings updated")
            }
          } catch (settingsError: any) {
            console.warn("⚠️ Exception updating system_settings:", settingsError.message)
          }

          testResults.switchAttempt = { success: true }
        }
      }
    } catch (error: any) {
      console.error("❌ Exception during season switch:", error)
      testResults.switchAttempt = { success: false, error: error.message }
    }

    // Check results after switching
    const { data: seasonsAfter, error: seasonsAfterError } = await supabase
      .from("seasons")
      .select("*")
      .order("created_at", { ascending: false })

    if (!seasonsAfterError && seasonsAfter) {
      testResults.afterSwitch = seasonsAfter
      console.log("📋 Seasons after switch:", seasonsAfter.map(s => ({ id: s.id, name: s.name, is_active: s.is_active })))
    }

    // Check system_settings
    const { data: systemSettings, error: settingsError } = await supabase
      .from("system_settings")
      .select("*")
      .eq("key", "current_season")

    if (!settingsError && systemSettings) {
      testResults.systemSettings = systemSettings
      console.log("⚙️ System settings:", systemSettings)
    }

    // Determine if the switch was successful
    const newActiveSeason = seasonsAfter?.find(s => s.is_active === true)
    const switchSuccessful = newActiveSeason?.id === targetSeason.id

    return NextResponse.json({
      success: true,
      message: `Season switching test completed - ${switchSuccessful ? 'SUCCESS' : 'FAILED'}`,
      testResults: {
        ...testResults,
        switchSuccessful,
        newActiveSeason,
        targetSeason
      }
    })

  } catch (error: any) {
    console.error("❌ Error testing season switching:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
