import { NextResponse } from "next/server"

export async function GET() {
  // Create a sample CSV template
  const csvTemplate = `Date,Time,Home Team,Away Team,Home Score,Away Score,Status,Season
2023-12-01,19:30,Team A,Team B,3,2,Completed,Season 1
2023-12-15,20:00,Team C,Team D,,,Scheduled,Season 1
2024-01-05,18:45,Team B,Team C,,,Scheduled,Season 1
`

  // Return the CSV as a downloadable file
  return new NextResponse(csvTemplate, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=matches_template.csv",
    },
  })
}
