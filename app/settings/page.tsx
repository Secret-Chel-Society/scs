"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { User } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  User as UserIcon, 
  Bell, 
  Shield, 
  Palette, 
  Gamepad2, 
  Mail, 
  Key, 
  Trash2, 
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  Trophy
} from "lucide-react"

function SettingsStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="text-3xl font-bold text-blue-200 mb-2">Profile</div>
        <div className="text-blue-300 flex items-center justify-center gap-2">
          <UserIcon className="h-5 w-5" />
          Settings
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="text-3xl font-bold text-green-200 mb-2">Security</div>
        <div className="text-green-300 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          & Privacy
        </div>
      </div>
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "300ms" }}>
        <div className="text-3xl font-bold text-purple-200 mb-2">Gaming</div>
        <div className="text-purple-300 flex items-center justify-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          Preferences
        </div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="text-3xl font-bold text-yellow-200 mb-2">Account</div>
        <div className="text-yellow-300 flex items-center justify-center gap-2">
          <Settings className="h-5 w-5" />
          Management
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    notifications: {
      email: true,
      discord: true,
      matchReminders: true,
      leagueUpdates: true,
      teamMessages: true
    },
    privacy: {
      profileVisibility: "public",
      showStats: true,
      showTeam: true,
      allowMessages: true
    },
    gaming: {
      preferredPosition: "any",
      autoJoin: false,
      showOnline: true,
      gameNotifications: true
    }
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Load user profile data
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          if (profile) {
            setFormData(prev => ({
              ...prev,
              displayName: profile.display_name || "",
              email: user.email || "",
              notifications: {
                email: profile.email_notifications ?? true,
                discord: profile.discord_notifications ?? true,
                matchReminders: profile.match_reminders ?? true,
                leagueUpdates: profile.league_updates ?? true,
                teamMessages: profile.team_messages ?? true
              },
              privacy: {
                profileVisibility: profile.profile_visibility || "public",
                showStats: profile.show_stats ?? true,
                showTeam: profile.show_team ?? true,
                allowMessages: profile.allow_messages ?? true
              },
              gaming: {
                preferredPosition: profile.preferred_position || "any",
                autoJoin: profile.auto_join ?? false,
                showOnline: profile.show_online ?? true,
                gameNotifications: profile.game_notifications ?? true
              }
            }))
          }
        }
      } catch (error) {
        console.error("Error loading user:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: formData.displayName,
          email_notifications: formData.notifications.email,
          discord_notifications: formData.notifications.discord,
          match_reminders: formData.notifications.matchReminders,
          league_updates: formData.notifications.leagueUpdates,
          team_messages: formData.notifications.teamMessages,
          profile_visibility: formData.privacy.profileVisibility,
          show_stats: formData.privacy.showStats,
          show_team: formData.privacy.showTeam,
          allow_messages: formData.privacy.allowMessages,
          preferred_position: formData.gaming.preferredPosition,
          auto_join: formData.gaming.autoJoin,
          show_online: formData.gaming.showOnline,
          game_notifications: formData.gaming.gameNotifications,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Update email if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        if (emailError) throw emailError
      }

      // Update password if provided
      if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        })
        if (passwordError) throw passwordError
      }

      setMessage({ type: "success", text: "Settings saved successfully!" })
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))
    } catch (error) {
      console.error("Error saving settings:", error)
      setMessage({ type: "error", text: "Failed to save settings. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || !confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) throw error
      
      // Redirect to home page after account deletion
      window.location.href = "/"
    } catch (error) {
      console.error("Error deleting account:", error)
      setMessage({ type: "error", text: "Failed to delete account. Please contact support." })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
            <p className="text-white/80">Please log in to access your settings.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-xl text-indigo-200 mb-8">
              Manage your account preferences and privacy settings
            </p>
          </div>

          {/* Settings Statistics */}
          <SettingsStats />

          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg backdrop-blur-sm border ${
              message.type === "success" 
                ? "bg-green-500/20 border-green-400/30 text-green-200" 
                : "bg-red-500/20 border-red-400/30 text-red-200"
            } animate-slide-up`} style={{ animationDelay: "500ms" }}>
              <div className="flex items-center gap-2">
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                {message.text}
              </div>
            </div>
          )}

          {/* Main Settings Content */}
          <div className="animate-slide-up" style={{ animationDelay: "600ms" }}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20">
              <CardContent className="p-6">
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-400/30">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                      <Shield className="h-4 w-4 mr-2" />
                      Privacy
                    </TabsTrigger>
                    <TabsTrigger value="gaming" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                      <Gamepad2 className="h-4 w-4 mr-2" />
                      Gaming
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="mt-6 animate-slide-in" style={{ animationDelay: "700ms" }}>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="displayName" className="text-white">Display Name</Label>
                        <Input
                          id="displayName"
                          value={formData.displayName}
                          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          placeholder="Enter your display name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-white">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          placeholder="Enter your email"
                        />
                      </div>

                      <Separator className="bg-white/20" />

                      <div>
                        <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPassword ? "text" : "password"}
                            value={formData.currentPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-white/70 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="newPassword" className="text-white">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          placeholder="Enter new password"
                        />
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="notifications" className="mt-6 animate-slide-in" style={{ animationDelay: "800ms" }}>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Email Notifications</Label>
                          <p className="text-white/70 text-sm">Receive updates via email</p>
                        </div>
                        <Switch
                          checked={formData.notifications.email}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, email: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Discord Notifications</Label>
                          <p className="text-white/70 text-sm">Receive updates via Discord</p>
                        </div>
                        <Switch
                          checked={formData.notifications.discord}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, discord: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Match Reminders</Label>
                          <p className="text-white/70 text-sm">Get reminded about upcoming matches</p>
                        </div>
                        <Switch
                          checked={formData.notifications.matchReminders}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, matchReminders: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">League Updates</Label>
                          <p className="text-white/70 text-sm">Receive league news and announcements</p>
                        </div>
                        <Switch
                          checked={formData.notifications.leagueUpdates}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, leagueUpdates: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Team Messages</Label>
                          <p className="text-white/70 text-sm">Receive messages from your team</p>
                        </div>
                        <Switch
                          checked={formData.notifications.teamMessages}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, teamMessages: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="privacy" className="mt-6 animate-slide-in" style={{ animationDelay: "900ms" }}>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-white">Profile Visibility</Label>
                        <select
                          value={formData.privacy.profileVisibility}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, profileVisibility: e.target.value }
                          }))}
                          className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2 mt-2"
                        >
                          <option value="public">Public</option>
                          <option value="team">Team Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Show Statistics</Label>
                          <p className="text-white/70 text-sm">Display your game statistics publicly</p>
                        </div>
                        <Switch
                          checked={formData.privacy.showStats}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showStats: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Show Team Affiliation</Label>
                          <p className="text-white/70 text-sm">Display your team membership</p>
                        </div>
                        <Switch
                          checked={formData.privacy.showTeam}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showTeam: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Allow Messages</Label>
                          <p className="text-white/70 text-sm">Allow other users to message you</p>
                        </div>
                        <Switch
                          checked={formData.privacy.allowMessages}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, allowMessages: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="gaming" className="mt-6 animate-slide-in" style={{ animationDelay: "1000ms" }}>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-white">Preferred Position</Label>
                        <select
                          value={formData.gaming.preferredPosition}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            gaming: { ...prev.gaming, preferredPosition: e.target.value }
                          }))}
                          className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2 mt-2"
                        >
                          <option value="any">Any Position</option>
                          <option value="center">Center</option>
                          <option value="left-wing">Left Wing</option>
                          <option value="right-wing">Right Wing</option>
                          <option value="defense">Defense</option>
                          <option value="goalie">Goalie</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Auto-Join Matches</Label>
                          <p className="text-white/70 text-sm">Automatically join available matches</p>
                        </div>
                        <Switch
                          checked={formData.gaming.autoJoin}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            gaming: { ...prev.gaming, autoJoin: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Show Online Status</Label>
                          <p className="text-white/70 text-sm">Display when you're online</p>
                        </div>
                        <Switch
                          checked={formData.gaming.showOnline}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            gaming: { ...prev.gaming, showOnline: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Game Notifications</Label>
                          <p className="text-white/70 text-sm">Receive in-game notifications</p>
                        </div>
                        <Switch
                          checked={formData.gaming.gameNotifications}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            gaming: { ...prev.gaming, gameNotifications: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-white/20">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
