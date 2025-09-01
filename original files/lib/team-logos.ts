// Map of team names to their logo filenames in storage
// This will be used to ensure consistent logo assignment
export const TEAM_LOGOS: Record<string, string> = {
  "Houston Ascension": "houston-ascension.png",
  "Thunder Bay Thrashers": "thunder-bay-thrashers.png",
  "Toronto Blades": "toronto-blades.png",
  "Vancouver Spartans": "vancouver-spartans.png",
  "Calgary Kings": "calgary-kings.png",
  "Philadelphia Liberty": "philadelphia-liberty.png", // Changed from "Philadelphia Outlaws"
  "St. Louis Skyhawks": "st-louis-skyhawks.png",
  "Montreal Royale": "montreal-royale.png",
  "New York Empire": "new-york-empire.png",
  "Chicago Syndicate": "chicago-syndicate.png",
  "Seattle Emeralds": "seattle-emeralds.png",
  "Dallas Desperados": "dallas-desperados.png", // Changed from "Dallas Outlaws"
}

// Function to get a logo filename for a team
export function getTeamLogoFilename(teamName: string): string | null {
  return TEAM_LOGOS[teamName] || null
}

// Function to get the full storage URL for a team logo
export function getTeamLogoStorageUrl(supabase: any, teamName: string): string | null {
  const filename = getTeamLogoFilename(teamName)
  if (!filename) return null

  const { data } = supabase.storage.from("media").getPublicUrl(`teams/${filename}`)
  return data?.publicUrl || null
}

// Function to update team logos in the database from storage
export async function updateTeamLogosFromStorage(supabase: any) {
  try {
    // For each team in our mapping
    const results = []

    for (const [teamName, filename] of Object.entries(TEAM_LOGOS)) {
      try {
        // Get the public URL from storage
        const { data } = supabase.storage.from("media").getPublicUrl(`teams/${filename}`)

        if (!data?.publicUrl) {
          results.push({ team: teamName, success: false, error: "Could not get public URL" })
          continue
        }

        // Update the team's logo_url in the database
        const { error } = await supabase.from("teams").update({ logo_url: data.publicUrl }).eq("name", teamName)

        if (error) {
          results.push({ team: teamName, success: false, error: error.message })
        } else {
          results.push({ team: teamName, success: true, url: data.publicUrl })
        }
      } catch (error: any) {
        results.push({ team: teamName, success: false, error: error.message })
      }
    }

    return { success: true, results }
  } catch (error: any) {
    console.error("Error updating team logos:", error)
    return { success: false, error: error.message }
  }
}
