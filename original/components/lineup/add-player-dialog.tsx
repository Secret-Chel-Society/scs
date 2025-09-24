"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface AddPlayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availablePlayers: any[]
  availablePositions: { value: string; label: string }[]
  onAddPlayer: (playerId: string, position: string) => void
  loading: boolean
}

export function AddPlayerDialog({
  open,
  onOpenChange,
  availablePlayers,
  availablePositions,
  onAddPlayer,
  loading,
}: AddPlayerDialogProps) {
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [selectedPosition, setSelectedPosition] = useState("")

  const handleSubmit = () => {
    if (selectedPlayer && selectedPosition) {
      onAddPlayer(selectedPlayer, selectedPosition)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSelectedPlayer("")
      setSelectedPosition("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Player to Lineup</DialogTitle>
          <DialogDescription>Select a player and position to add to your lineup.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="player">Player</Label>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.users.gamer_tag_id} ({player.users.primary_position})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {availablePositions.map((position) => (
                  <SelectItem key={position.value} value={position.value}>
                    {position.label} ({position.value})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedPlayer || !selectedPosition || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Adding..." : "Add to Lineup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
