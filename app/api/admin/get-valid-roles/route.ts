import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return default roles without querying the database to avoid rate limits
    // Note: Site Owner is intentionally excluded - it should not be assignable via UI
    return NextResponse.json({
      validRoles: [
        "Player",
        "GM",
        "AGM",
        "Owner",
        "AHL Owner",
        "AHL GM",
        "AHL AGM",
        "League Bog",
        "Admin",
      ],
    })
  } catch (error) {
    console.error("Error in get-valid-roles:", error)
    return NextResponse.json({ error: "Failed to fetch valid roles" }, { status: 500 })
  }
}
