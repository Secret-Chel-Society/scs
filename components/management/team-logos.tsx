"use client"

import Image from "next/image"

interface Team {
  id: string
  name: string
  logo_url: string | null
}

interface TeamLogosProps {
  teams: Team[]
  maxDisplay?: number
  size?: "sm" | "md" | "lg"
}

export function TeamLogos({ teams, maxDisplay = 5, size = "sm" }: TeamLogosProps) {
  if (!teams || teams.length === 0) {
    return <div className="text-xs text-muted-foreground">No claims yet</div>
  }

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  const displayTeams = teams.slice(0, maxDisplay)
  const remainingCount = teams.length - maxDisplay

  const getTeamInitials = (name: string) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayTeams.map((team, index) => (
        <div key={team.id} className={`${sizeClasses[size]} relative flex-shrink-0`} title={team.name}>
          {team.logo_url ? (
            <Image
              src={team.logo_url || "/placeholder.svg"}
              alt={team.name}
              fill
              className="object-contain rounded-full border border-border"
            />
          ) : (
            <div
              className={`${sizeClasses[size]} bg-muted border border-border rounded-full flex items-center justify-center text-xs font-medium`}
            >
              {getTeamInitials(team.name)}
            </div>
          )}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} bg-muted border border-border rounded-full flex items-center justify-center text-xs font-medium`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
