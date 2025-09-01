/**
 * Normalizes position names to standard abbreviations
 * Handles both full names and abbreviations
 */
export function normalizePosition(position: string | null | undefined): string | null {
  if (!position) return null

  const normalized = position.toString().trim().toLowerCase()

  const positionMap: Record<string, string> = {
    // Goalie variations
    goalie: "G",
    g: "G",
    goalkeeper: "G",

    // Center variations
    center: "C",
    c: "C",
    centre: "C",

    // Left Wing variations
    "left wing": "LW",
    lw: "LW",
    leftwing: "LW",
    "left-wing": "LW",

    // Right Wing variations
    "right wing": "RW",
    rw: "RW",
    rightwing: "RW",
    "right-wing": "RW",

    // Left Defense variations
    "left defense": "LD",
    ld: "LD",
    leftdefense: "LD",
    "left-defense": "LD",
    "left defence": "LD",
    leftdefence: "LD",
    "left-defence": "LD",

    // Right Defense variations
    "right defense": "RD",
    rd: "RD",
    rightdefense: "RD",
    "right-defense": "RD",
    "right defence": "RD",
    rightdefence: "RD",
    "right-defence": "RD",
  }

  return positionMap[normalized] || position
}

/**
 * Gets the full position name from an abbreviation
 */
export function getFullPositionName(abbreviation: string | null | undefined): string | null {
  if (!abbreviation) return null

  const abbr = abbreviation.toString().trim().toUpperCase()

  const positionMap: Record<string, string> = {
    G: "Goalie",
    C: "Center",
    LW: "Left Wing",
    RW: "Right Wing",
    LD: "Left Defense",
    RD: "Right Defense",
  }

  return positionMap[abbr] || abbreviation
}

/**
 * Gets the position abbreviation from a full name or abbreviation
 */
export function getPositionAbbreviation(position: string | null | undefined): string | null {
  return normalizePosition(position)
}
