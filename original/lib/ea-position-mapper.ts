// EA Position Code to Position Name Mapping
export const eaPositionMap = {
  "0": "G",
  "1": "RD",
  "2": "LD",
  "3": "RW",
  "4": "LW",
  "5": "C",
}

// Position to Category Mapping
export const positionCategoryMap = {
  RW: "offense",
  LW: "offense",
  C: "offense",
  RD: "defense",
  LD: "defense",
  G: "goalie",
}

// Get category based on EA position code
export function getCategoryFromEA(eaPositionCode: string) {
  const position = eaPositionMap[eaPositionCode]
  return positionCategoryMap[position] || "unknown"
}

// Get category based on standard position
export function getPositionCategory(position: string) {
  // Standardize the position first
  const standardPosition = mapEaPositionToStandard(position)
  return positionCategoryMap[standardPosition] || "unknown"
}

// Map EA position code or name to standard position
export function mapEaPositionToStandard(position: string): string {
  // If it's a numeric code, use the mapping
  if (eaPositionMap[position]) {
    return eaPositionMap[position]
  }

  // Handle PosSorted field specifically (this is the most accurate source)
  if (position === "leftDefense") return "LD"
  if (position === "rightDefense") return "RD"

  // Handle text position names
  const positionLower = position.toLowerCase()
  if (positionLower === "goalie" || positionLower === "g") {
    return "G"
  }
  if (positionLower === "right defense" || positionLower === "rd" || positionLower === "rightdefense") {
    return "RD"
  }
  if (positionLower === "left defense" || positionLower === "ld" || positionLower === "leftdefense") {
    return "LD"
  }
  if (positionLower === "right wing" || positionLower === "rw" || positionLower === "rightwing") {
    return "RW"
  }
  if (positionLower === "left wing" || positionLower === "lw" || positionLower === "leftwing") {
    return "LW"
  }
  if (positionLower === "center" || positionLower === "c") {
    return "C"
  }

  // Default to the original position if no mapping found
  return position
}
