"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface LeagueSettings {
  bidding_enabled: boolean
  bidding_duration: number
  bidding_increment: number
  min_salary: number
  max_salary: number
  current_season: string
}

const defaultSettings: LeagueSettings = {
  bidding_enabled: false,
  bidding_duration: 14400,
  bidding_increment: 250000,
  min_salary: 750000,
  max_salary: 15000000,
  current_season: "Season 1",
}

function LeagueSettingsPanel({ league, title }: { league: "nhl" | "ahl"; title: string }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<LeagueSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [league])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/league-settings?league=${league}`)
      if (response.ok) {
        const data = await response.json()
        setSettings({
          bidding_enabled: data.settings?.bidding_enabled || false,
          bidding_duration: data.settings?.bidding_duration || 14400,
          bidding_increment: data.settings?.bidding_increment || 250000,
          min_salary: data.settings?.min_salary || 750000,
          max_salary: data.settings?.max_salary || 15000000,
          current_season: data.settings?.current_season || `${title} Season 1`,
        })
      }
    } catch (error) {
      console.error(`Error loading ${league} settings:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSetting = async (key: string, value: any) => {
    try {
      setIsSaving(true)
      const response = await fetch("/api/admin/league-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ league, key, value, userId: user?.id }),
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save setting")
      }

      toast({
        title: "Setting saved",
        description: `${title} ${key.replace(/_/g, " ")} has been updated.`,
      })
    } catch (error: any) {
      toast({
        title: "Error saving setting",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleBidding = async () => {
    const newValue = !settings.bidding_enabled
    setSettings(prev => ({ ...prev, bidding_enabled: newValue }))
    await saveSetting("bidding_enabled", newValue)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bidding Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Bidding Status</CardTitle>
          <CardDescription>Enable or disable the bidding system for {title}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Bidding {settings.bidding_enabled ? "Enabled" : "Disabled"}</p>
              <p className="text-sm text-muted-foreground">
                {settings.bidding_enabled 
                  ? "Players can be bid on by teams" 
                  : "Bidding is currently turned off"}
              </p>
            </div>
            <Switch
              checked={settings.bidding_enabled}
              onCheckedChange={handleToggleBidding}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Season */}
      <Card>
        <CardHeader>
          <CardTitle>Current Season</CardTitle>
          <CardDescription>Set the current season name for {title}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={settings.current_season}
              onChange={(e) => setSettings(prev => ({ ...prev, current_season: e.target.value }))}
              placeholder="e.g., Season 12"
              className="flex-1"
            />
            <Button 
              onClick={() => saveSetting("current_season", settings.current_season)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bidding Duration */}
      <Card>
        <CardHeader>
          <CardTitle>Bidding Duration</CardTitle>
          <CardDescription>
            How long each bid window lasts (in seconds). Current: {formatDuration(settings.bidding_duration)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="number"
              value={settings.bidding_duration}
              onChange={(e) => setSettings(prev => ({ ...prev, bidding_duration: parseInt(e.target.value) || 0 }))}
              placeholder="14400"
              className="flex-1"
            />
            <Button 
              onClick={() => saveSetting("bidding_duration", settings.bidding_duration)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Common values: 3600 (1 hour), 7200 (2 hours), 14400 (4 hours), 86400 (24 hours)
          </p>
        </CardContent>
      </Card>

      {/* Bid Increment */}
      <Card>
        <CardHeader>
          <CardTitle>Minimum Bid Increment</CardTitle>
          <CardDescription>The minimum amount a new bid must exceed the current bid</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="number"
              value={settings.bidding_increment}
              onChange={(e) => setSettings(prev => ({ ...prev, bidding_increment: parseInt(e.target.value) || 0 }))}
              placeholder="250000"
              className="flex-1"
            />
            <Button 
              onClick={() => saveSetting("bidding_increment", settings.bidding_increment)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Current: ${settings.bidding_increment.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Salary Range */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Range</CardTitle>
          <CardDescription>Minimum and maximum salary values for bids</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Salary</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.min_salary}
                  onChange={(e) => setSettings(prev => ({ ...prev, min_salary: parseInt(e.target.value) || 0 }))}
                  placeholder="750000"
                />
                <Button 
                  size="sm"
                  onClick={() => saveSetting("min_salary", settings.min_salary)}
                  disabled={isSaving}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">${settings.min_salary.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label>Maximum Salary</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.max_salary}
                  onChange={(e) => setSettings(prev => ({ ...prev, max_salary: parseInt(e.target.value) || 0 }))}
                  placeholder="15000000"
                />
                <Button 
                  size="sm"
                  onClick={() => saveSetting("max_salary", settings.max_salary)}
                  disabled={isSaving}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">${settings.max_salary.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function LeagueSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">League Settings</h2>
        <p className="text-muted-foreground">
          Manage bidding settings, seasons, and configuration for NHL and AHL leagues.
        </p>
      </div>

      <Tabs defaultValue="nhl" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="nhl">NHL Settings</TabsTrigger>
          <TabsTrigger value="ahl">AHL Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="nhl" className="mt-6">
          <LeagueSettingsPanel league="nhl" title="NHL" />
        </TabsContent>
        <TabsContent value="ahl" className="mt-6">
          <LeagueSettingsPanel league="ahl" title="AHL" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
