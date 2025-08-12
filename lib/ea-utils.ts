/**
 * Utility functions for EA Sports NHL API data
 */

/**
 * Maps EA position codes to standard position abbreviations
 * @param positionCode The EA position code as a string
 * @returns The standard position abbreviation
 */
export function mapEaPositionToStandard(positionCode: string): string {
  const positionMap: Record<string, string> = {
    "0": "G",
    "1": "RD",
    "2": "LD",
    "3": "RW",
    "4": "LW",
    "5": "C",
  }

  return positionMap[positionCode] || positionCode
}

/**
 * Determines if a position is a goalie position
 * @param position The position code or abbreviation
 * @returns True if the position is a goalie position
 */
export function isGoaliePosition(position: string): boolean {
  return position === "0" || position === "G" || position.toLowerCase() === "goalie"
}

/**
 * Formats time on ice from seconds to MM:SS format
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export function formatTimeOnIce(seconds: number): string {
  if (!seconds) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
