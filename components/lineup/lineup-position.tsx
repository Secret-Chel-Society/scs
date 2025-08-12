"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LineupPositionProps {
  position: string
  lineup: any[]
  onRemove: (id: string) => void
  loading: boolean
}

export function LineupPosition({ position, lineup, onRemove, loading }: LineupPositionProps) {
  // Find player in this position
  const player = lineup.find((p) => p.position === position)

  // Position labels
  const positionLabels: Record<string, string> = {
    C: "Center",
    LW: "Left Wing",
    RW: "Right Wing",
    LD: "Left Defense",
    RD: "Right Defense",
    G: "Goalie",
  }

  if (!player) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {position}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{positionLabels[position]}</p>
              <p className="text-xs text-muted-foreground">Not assigned</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const playerName = player.players.users.gamer_tag_id
  const naturalPosition = player.players.users.primary_position
  const avatarUrl = player.players.users.avatar_url

  // Get initials for avatar fallback
  const initials = playerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <Card>
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={playerName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{playerName}</p>
            <p className="text-xs text-muted-foreground">
              {positionLabels[position]} ({position})
              {naturalPosition !== position && (
                <span className="ml-1 text-amber-600 dark:text-amber-400">• Natural: {naturalPosition}</span>
              )}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onRemove(player.id)} disabled={loading}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </CardContent>
    </Card>
  )
}
