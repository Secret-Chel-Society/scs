"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState } from "react"

interface TeamLogoProps {
  teamName: string
  teamId?: string
  logoUrl?: string | null
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  "Houston Ascension": { primary: "#8A2BE2", secondary: "#FF4500" }, // Purple and Orange
  "Thunder Bay Thrashers": { primary: "#00008B", secondary: "#C0C0C0" }, // Dark Blue and Silver
  "Toronto Blades": { primary: "#0038A8", secondary: "#FFFFFF" }, // Blue and White
  "Vancouver Spartans": { primary: "#006400", secondary: "#C0C0C0" }, // Green and Silver
  "Calgary Kings": { primary: "#8B0000", secondary: "#FFD700" }, // Dark Red and Gold
  "Philadelphia Outlaws": { primary: "#000000", secondary: "#FF7F00" }, // Black and Orange
  "St. Louis Skyhawks": { primary: "#00529B", secondary: "#FFD700" }, // Blue and Gold
  "Default Team": { primary: "#6E6E6E", secondary: "#FFFFFF" }, // Gray and White
}

const SIZE_CLASSES = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-base",
  xl: "w-24 h-24 text-lg",
}

// Generate different pattern backgrounds
function getPatternBackground(type: number, color: string): string {
  switch (type) {
    case 0:
      return `radial-gradient(circle at 30% 30%, ${color} 2%, transparent 2.5%), 
              radial-gradient(circle at 70% 70%, ${color} 2%, transparent 2.5%),
              radial-gradient(circle at 30% 70%, ${color} 2%, transparent 2.5%),
              radial-gradient(circle at 70% 30%, ${color} 2%, transparent 2.5%),
              radial-gradient(circle at 50% 50%, ${color} 2%, transparent 2.5%)`
    case 1:
      return `repeating-linear-gradient(45deg, transparent, transparent 5px, ${color} 5px, ${color} 6px)`
    case 2:
      return `linear-gradient(45deg, ${color} 25%, transparent 25%), 
              linear-gradient(-45deg, ${color} 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, ${color} 75%), 
              linear-gradient(-45deg, transparent 75%, ${color} 75%)`
    case 3:
    default:
      return `radial-gradient(circle at 50% 50%, ${color} 10%, transparent 10.5%)`
  }
}

export function TeamLogo({ teamName, teamId, logoUrl, size = "md", className }: TeamLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // If we have a valid logo URL and no error, show the actual logo
  if (logoUrl && !imageError) {
    return (
      <div className={cn("relative rounded-full overflow-hidden", SIZE_CLASSES[size], className)}>
        <Image
          src={logoUrl || "/placeholder.svg"}
          alt={`${teamName} logo`}
          fill
          className="object-cover"
          onError={() => {
            console.log(`Failed to load logo for ${teamName}: ${logoUrl}`)
            setImageError(true)
          }}
          onLoad={() => setImageLoading(false)}
        />
        {imageLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />}
      </div>
    )
  }

  // Fallback to generated logo
  console.log(`Using generated logo for ${teamName} (logoUrl: ${logoUrl}, error: ${imageError})`)

  // Get team colors or use default if not found
  const colors = TEAM_COLORS[teamName] || TEAM_COLORS["Default Team"]

  // Get team initials (up to 2 characters)
  const initials = teamName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  // Generate a unique pattern based on team name
  const patternSeed = teamName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const patternType = patternSeed % 4 // 4 different pattern types

  // Generate the pattern background
  const patternBackground = getPatternBackground(patternType, colors.secondary)

  return (
    <div
      className={cn("relative rounded-full flex items-center justify-center font-bold", SIZE_CLASSES[size], className)}
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary} 70%, ${colors.secondary} 100%)`,
        boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`,
      }}
    >
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background: patternBackground,
        }}
      />

      {/* Team initials */}
      <span className="relative text-white drop-shadow-md">{initials}</span>
    </div>
  )
}
