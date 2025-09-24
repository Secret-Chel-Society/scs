import { format } from "date-fns"

// Define CSV match type
export interface CSVMatch {
  date: string
  time: string
  homeTeam: string
  awayTeam: string
  homeScore?: string
  awayScore?: string
  status?: string
  season?: string
}

// Parse CSV text into match objects
export function parseCSV(text: string): CSVMatch[] {
  // Split by lines and remove empty lines
  const lines = text.split("\n").filter((line) => line.trim() !== "")
  if (lines.length < 2) {
    throw new Error("CSV file must contain a header row and at least one data row")
  }

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const requiredColumns = ["date", "time", "home team", "away team"]
  const missingColumns = requiredColumns.filter((col) => !header.includes(col))
  if (missingColumns.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingColumns.join(", ")}`)
  }

  // Parse data rows
  const matches: CSVMatch[] = []
  for (let i = 1; i < lines.length; i++) {
    // Handle quoted fields with commas
    const line = lines[i]
    const fields: string[] = []
    let inQuotes = false
    let currentField = ""

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        fields.push(currentField)
        currentField = ""
      } else {
        currentField += char
      }
    }
    fields.push(currentField) // Add the last field

    // Clean up quoted fields
    const cleanFields = fields.map((field) => {
      field = field.trim()
      if (field.startsWith('"') && field.endsWith('"')) {
        field = field.substring(1, field.length - 1).replace(/""/g, '"')
      }
      return field
    })

    // Map fields to match object
    const match: CSVMatch = {
      date: cleanFields[header.indexOf("date")],
      time: cleanFields[header.indexOf("time")],
      homeTeam: cleanFields[header.indexOf("home team")],
      awayTeam: cleanFields[header.indexOf("away team")],
    }

    // Add optional fields if they exist
    if (header.includes("home score")) {
      match.homeScore = cleanFields[header.indexOf("home score")]
    }
    if (header.includes("away score")) {
      match.awayScore = cleanFields[header.indexOf("away score")]
    }
    if (header.includes("status")) {
      match.status = cleanFields[header.indexOf("status")]
    }
    if (header.includes("season")) {
      match.season = cleanFields[header.indexOf("season")]
    }

    matches.push(match)
  }

  return matches
}

// Generate CSV from matches
export function generateCSV(matches: any[], dateColumnName = "match_date"): string {
  // Create CSV header
  let csv = "Date,Time,Home Team,Away Team,Home Score,Away Score,Status,Season\n"

  // Add match data
  matches.forEach((match) => {
    const matchDate = new Date(match[dateColumnName])
    const date = format(matchDate, "yyyy-MM-dd")
    const time = format(matchDate, "HH:mm")
    const homeTeam = match.home_team?.name || "Unknown"
    const awayTeam = match.away_team?.name || "Unknown"
    const homeScore = match.home_score !== null ? match.home_score : ""
    const awayScore = match.away_score !== null ? match.away_score : ""
    const status = match.status || "Scheduled"
    const season = match.season_name || ""

    // Escape fields that might contain commas
    const escapeCsvField = (field: string) => {
      if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`
      }
      return field
    }

    csv += `${date},${time},${escapeCsvField(homeTeam)},${escapeCsvField(awayTeam)},${homeScore},${awayScore},${status},${escapeCsvField(season)}\n`
  })

  return csv
}
