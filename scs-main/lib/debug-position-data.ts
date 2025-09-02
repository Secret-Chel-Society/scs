/**
 * Utility function to debug position data from EA API
 */
export function debugPositionData(player: any) {
  return {
    name: player.persona || player.playername || "Unknown",
    position: player.position,
    posSorted: player.posSorted,
    positionCode:
      typeof player.position === "string" && !isNaN(Number.parseInt(player.position))
        ? Number.parseInt(player.position)
        : null,
    mappedPosition: mapPositionToDisplay(player),
  }
}

/**
 * Maps position data from EA API to display format
 */
export function mapPositionToDisplay(player: any): string {
  // Use posSorted field first if available
  if (player.posSorted) {
    if (player.posSorted === "leftDefense") return "LD"
    if (player.posSorted === "rightDefense") return "RD"
    if (player.posSorted === "leftWing") return "LW"
    if (player.posSorted === "rightWing") return "RW"
    if (player.posSorted === "center") return "C"
    if (player.posSorted === "goalie") return "G"
  }

  // Fall back to position code mapping
  if (player.position === "0") return "G"
  if (player.position === "1") return "RD"
  if (player.position === "2") return "LD"
  if (player.position === "3") return "RW"
  if (player.position === "4") return "LW"
  if (player.position === "5") return "C"

  // Handle text position names
  const positionLower = (player.position || "").toLowerCase()
  if (positionLower === "goalie") return "G"
  if (positionLower === "rightdefense") return "RD"
  if (positionLower === "leftdefense") return "LD"
  if (positionLower === "rightwing") return "RW"
  if (positionLower === "leftwing") return "LW"
  if (positionLower === "center") return "C"

  // Default to unknown
  return "?"
}
