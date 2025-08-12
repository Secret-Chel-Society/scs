"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function FixAwardSeasons() {
  const { toast } = useToast()
  const [awardId, setAwardId] = useState("")
  const [seasonNumber, setSeasonNumber] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleFixSeason() {
    if (!awardId || !seasonNumber) {
      toast({
        title: "Missing information",
        description: "Please provide both award ID and season number",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/fix-award-seasons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          awardId,
          seasonNumber: Number.parseInt(seasonNumber, 10),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix award season")
      }

      toast({
        title: "Success",
        description: data.message,
      })

      // Reset form
      setAwardId("")
      setSeasonNumber("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Award Seasons</CardTitle>
        <CardDescription>Directly update the season number for a specific award</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="award-id">Award ID</Label>
            <Input
              id="award-id"
              value={awardId}
              onChange={(e) => setAwardId(e.target.value)}
              placeholder="Enter award ID"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="season-number">Season Number</Label>
            <Input
              id="season-number"
              type="number"
              value={seasonNumber}
              onChange={(e) => setSeasonNumber(e.target.value)}
              placeholder="Enter season number (e.g., 1, 2, 3)"
              min="1"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleFixSeason} disabled={loading}>
          {loading ? "Fixing..." : "Fix Season"}
        </Button>
      </CardFooter>
    </Card>
  )
}
